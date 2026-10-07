import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  DEPARTEMENTS,
  bornesPeriode,
  cleRapprochement,
  erreursValeurs,
  estCodeDepartement,
  formulaireStatistique,
  saisiesManquantes,
  type CleEntete,
  type DefinitionFormulaire,
} from "@dps/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { NiveauAutorite, StatutRapportStatistique } from "../generated/prisma/enums.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";
import type { CreerRapportDto, EnregistrerRapportDto, ListerRapportsQueryDto } from "./dto/rapports-statistiques.dto.js";

type Entete = Partial<Record<CleEntete, string>>;

// Champs d'en-tête exigés à la soumission (quand le formulaire les comporte) :
// ils désignent l'établissement et l'autorité destinataire.
const ENTETE_OBLIGATOIRE: CleEntete[] = ["departement", "zoneSanitaire", "formationSanitaire"];

const LIBELLES_ENTETE: Record<CleEntete, string> = {
  departement: "Département",
  zoneSanitaire: "Zone sanitaire",
  commune: "Commune",
  arrondissement: "Arrondissement",
  formationSanitaire: "Formation sanitaire",
  telephone: "Téléphone",
  email: "Email",
};

const UTILISATEUR_RESUME = { select: { id: true, nom: true, prenom: true } } as const;

const INCLUSIONS = {
  organisation: { select: { id: true, nom: true, typeStructure: true } },
  creePar: UTILISATEUR_RESUME,
  soumisPar: UTILISATEUR_RESUME,
  validePar: UTILISATEUR_RESUME,
} as const;

// Liste : sans les valeurs saisies (potentiellement volumineuses).
const SELECTION_LISTE = {
  id: true,
  formulaireCode: true,
  formulaireVersion: true,
  periode: true,
  statut: true,
  departement: true,
  entete: true,
  soumisLe: true,
  recuLe: true,
  valideLe: true,
  createdAt: true,
  updatedAt: true,
  ...INCLUSIONS,
} as const;

@Injectable()
export class RapportsStatistiquesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Établissement (responsable du compte)
  // ---------------------------------------------------------------------------

  async lister(query: ListerRapportsQueryDto, user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    return this.prisma.rapportStatistique.findMany({
      where: { organisationId, formulaireCode: query.formulaire, statut: query.statut },
      select: SELECTION_LISTE,
      orderBy: [{ periode: "desc" }, { formulaireCode: "asc" }],
    });
  }

  async creer(dto: CreerRapportDto, user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    const def = this.definition(dto.formulaireCode);

    const bornes = bornesPeriode(def.periodicite, dto.periode);
    if (!bornes) {
      throw new BadRequestException(
        def.periodicite === "MENSUELLE" ? "Période attendue au format AAAA-MM" : "Période attendue au format AAAA-Snn (semaine ISO)",
      );
    }
    if (bornes.debut.getTime() > Date.now()) {
      throw new BadRequestException("La période n'a pas encore commencé");
    }

    const existant = await this.prisma.rapportStatistique.findUnique({
      where: { organisationId_formulaireCode_periode: { organisationId, formulaireCode: def.code, periode: dto.periode } },
      select: { id: true },
    });
    if (existant) throw new ConflictException("Un rapport existe déjà pour ce formulaire et cette période");

    const organisation = await this.prisma.organisation.findUniqueOrThrow({ where: { id: organisationId } });
    const prerempli: Record<CleEntete, string | null> = {
      departement: organisation.departement,
      zoneSanitaire: organisation.zoneSanitaire,
      commune: organisation.commune,
      arrondissement: organisation.arrondissement,
      formationSanitaire: organisation.nom,
      telephone: organisation.telephone,
      email: organisation.email,
    };
    const entete: Entete = {};
    for (const cle of def.entete) entete[cle] = prerempli[cle] ?? "";

    const rapport = await this.prisma.rapportStatistique.create({
      data: {
        organisationId,
        formulaireCode: def.code,
        formulaireVersion: def.version,
        periode: dto.periode,
        entete,
        valeurs: {},
        ...this.colonnesDestinataire(entete),
        creeParId: user.sub,
      },
      include: INCLUSIONS,
    });
    await this.tracer(user, organisationId, "rapport_statistique_cree", rapport.id);
    return rapport;
  }

  async obtenir(id: string, user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    const rapport = await this.prisma.rapportStatistique.findFirst({ where: { id, organisationId }, include: INCLUSIONS });
    if (!rapport) throw new NotFoundException("Rapport introuvable");
    return rapport;
  }

  async enregistrer(id: string, dto: EnregistrerRapportDto, user: JwtAccessPayload) {
    const rapport = await this.obtenir(id, user);
    if (rapport.statut !== StatutRapportStatistique.BROUILLON) {
      throw new ForbiddenException("Un rapport soumis ne peut plus être modifié");
    }
    const def = this.definition(rapport.formulaireCode);

    const entete = { ...(rapport.entete as Entete) };
    for (const [cle, v] of Object.entries(dto.entete ?? {})) {
      if (!def.entete.includes(cle as CleEntete)) throw new BadRequestException(`Champ d'en-tête inconnu : ${cle}`);
      if (typeof v !== "string" || v.length > 191) throw new BadRequestException(`${cle} : texte de 191 caractères maximum attendu`);
      if (cle === "departement" && v !== "" && !estCodeDepartement(v)) throw new BadRequestException("Département inconnu");
      entete[cle as CleEntete] = v.trim();
    }

    const valeurs = { ...(rapport.valeurs as Record<string, unknown>) };
    for (const [cle, v] of Object.entries(dto.valeurs ?? {})) {
      if (v === null) delete valeurs[cle];
      else valeurs[cle] = v;
    }
    const erreurs = erreursValeurs(def, valeurs);
    if (erreurs.length > 0) throw new BadRequestException(erreurs.slice(0, 20));

    return this.prisma.rapportStatistique.update({
      where: { id },
      data: { entete, valeurs: valeurs as Prisma.InputJsonObject, ...this.colonnesDestinataire(entete) },
      include: INCLUSIONS,
    });
  }

  async soumettre(id: string, user: JwtAccessPayload) {
    const rapport = await this.obtenir(id, user);
    if (rapport.statut !== StatutRapportStatistique.BROUILLON) throw new ConflictException("Ce rapport est déjà soumis");
    const def = this.definition(rapport.formulaireCode);

    const entete = rapport.entete as Entete;
    const enteteManquant = ENTETE_OBLIGATOIRE.filter((cle) => def.entete.includes(cle) && !entete[cle]);
    if (enteteManquant.length > 0) {
      throw new BadRequestException(`En-tête incomplet : ${enteteManquant.map((c) => LIBELLES_ENTETE[c]).join(", ")}`);
    }
    const manquantes = saisiesManquantes(def, rapport.valeurs as Record<string, unknown>);
    if (manquantes.length > 0) {
      throw new BadRequestException(`${manquantes.length} case(s) à remplir avant la soumission`);
    }

    const soumis = await this.prisma.rapportStatistique.update({
      where: { id },
      data: { statut: StatutRapportStatistique.SOUMIS, soumisParId: user.sub, soumisLe: new Date() },
      include: INCLUSIONS,
    });
    await this.tracer(user, rapport.organisationId, "rapport_statistique_soumis", id);
    return soumis;
  }

  // ---------------------------------------------------------------------------
  // Autorités sanitaires
  // ---------------------------------------------------------------------------

  async monAutorite(user: JwtAccessPayload) {
    return this.exigerAutorite(user);
  }

  async listerPourAutorite(query: ListerRapportsQueryDto, user: JwtAccessPayload) {
    const autorite = await this.exigerAutorite(user);
    return this.prisma.rapportStatistique.findMany({
      where: {
        AND: [
          this.ressort(autorite),
          { formulaireCode: query.formulaire, organisationId: query.organisationId },
          query.statut ? { statut: query.statut } : {},
        ],
      },
      select: SELECTION_LISTE,
      orderBy: [{ soumisLe: "desc" }],
    });
  }

  async obtenirPourAutorite(id: string, user: JwtAccessPayload) {
    const autorite = await this.exigerAutorite(user);
    const rapport = await this.prisma.rapportStatistique.findFirst({
      where: { AND: [{ id }, this.ressort(autorite)] },
      include: INCLUSIONS,
    });
    if (!rapport) throw new NotFoundException("Rapport introuvable");

    // « Date de réception à la ZS » : première consultation par la zone sanitaire.
    if (autorite.niveau === NiveauAutorite.ZONE_SANITAIRE && !rapport.recuLe) {
      return this.prisma.rapportStatistique.update({ where: { id }, data: { recuLe: new Date() }, include: INCLUSIONS });
    }
    return rapport;
  }

  async valider(id: string, user: JwtAccessPayload) {
    const autorite = await this.exigerAutorite(user);
    if (autorite.niveau !== NiveauAutorite.ZONE_SANITAIRE) {
      throw new ForbiddenException("Seule la zone sanitaire destinataire valide un rapport");
    }
    const rapport = await this.obtenirPourAutorite(id, user);
    if (rapport.statut !== StatutRapportStatistique.SOUMIS) throw new ConflictException("Ce rapport est déjà validé");

    const valide = await this.prisma.rapportStatistique.update({
      where: { id },
      data: { statut: StatutRapportStatistique.VALIDE, valideParId: user.sub, valideLe: new Date() },
      include: INCLUSIONS,
    });
    await this.tracer(user, rapport.organisationId, "rapport_statistique_valide", id);
    return valide;
  }

  // ---------------------------------------------------------------------------

  private definition(code: string): DefinitionFormulaire {
    const def = formulaireStatistique(code);
    if (!def) throw new BadRequestException("Formulaire inconnu");
    return def;
  }

  private exigerOrganisation(user: JwtAccessPayload): string {
    if (!user.organisationId) throw new ForbiddenException("Réservé aux comptes établissement");
    return user.organisationId;
  }

  private async exigerAutorite(user: JwtAccessPayload) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: user.sub },
      select: { autoriteSanitaire: true },
    });
    const autorite = utilisateur?.autoriteSanitaire;
    if (!autorite || !autorite.actif) throw new ForbiddenException("Aucune autorité sanitaire active associée à ce compte");
    return { ...autorite, departementLibelle: autorite.departement ? DEPARTEMENTS[autorite.departement as keyof typeof DEPARTEMENTS] : null };
  }

  // Rapports soumis du ressort de l'autorité : la zone sanitaire voit sa zone
  // (département + zone de l'en-tête), la direction départementale son
  // département, le niveau national tout.
  private ressort(autorite: { niveau: NiveauAutorite; departement: string | null; zoneSanitaireCle: string | null }) {
    const soumis: Prisma.RapportStatistiqueWhereInput = {
      statut: { in: [StatutRapportStatistique.SOUMIS, StatutRapportStatistique.VALIDE] },
    };
    if (autorite.niveau === NiveauAutorite.NATIONAL) return soumis;
    // Une autorité mal paramétrée (sans département) ne voit rien.
    const departement = autorite.departement ?? "__aucun__";
    if (autorite.niveau === NiveauAutorite.DEPARTEMENT) return { ...soumis, departement };
    return { ...soumis, departement, zoneSanitaireCle: autorite.zoneSanitaireCle ?? "__aucune__" };
  }

  private colonnesDestinataire(entete: Entete) {
    return {
      departement: entete.departement || null,
      zoneSanitaireCle: entete.zoneSanitaire ? cleRapprochement(entete.zoneSanitaire) : null,
    };
  }

  private async tracer(user: JwtAccessPayload, organisationId: string, action: string, entiteId: string) {
    await this.prisma.journalAudit.create({
      data: { organisationId, utilisateurId: user.sub, action, entite: "RapportStatistique", entiteId },
    });
  }
}
