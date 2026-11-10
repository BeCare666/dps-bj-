import { BadRequestException, Injectable } from "@nestjs/common";
import {
  FORMULAIRES_STATISTIQUES,
  bornesPeriode,
  formulaireStatistique,
  indicateursFormulaire,
  periodeDeDate,
  periodesEntre,
  valeurIndicateur,
  type DefinitionFormulaire,
} from "@dps/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { NiveauAutorite, StatutRapportStatistique, TypeStructure } from "../generated/prisma/enums.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";
import { RapportsStatistiquesService } from "./rapports-statistiques.service.js";
import {
  JOUR_MS,
  dateUtc,
  etablissementDansRessort,
  joursEntre,
  liste,
  moisDe,
  statistiqueDelai,
} from "./autorite-statistiques.util.js";
import type { DonneesQueryDto, FiltresAutoriteDto, TransmissionsQueryDto } from "./dto/autorite-statistiques.dto.js";

type Autorite = Awaited<ReturnType<RapportsStatistiquesService["exigerAutorite"]>>;

const MAX_CLES = 600;

const SELECTION_ETABLISSEMENT = {
  id: true,
  nom: true,
  type: true,
  typeStructure: true,
  departement: true,
  commune: true,
  arrondissement: true,
  zoneSanitaire: true,
  telephone: true,
  email: true,
  actif: true,
  createdAt: true,
} as const;

const SELECTION_RAPPORT = {
  id: true,
  organisationId: true,
  formulaireCode: true,
  periode: true,
  statut: true,
  soumisLe: true,
  recuLe: true,
  valideLe: true,
  organisation: { select: { id: true, nom: true, commune: true, typeStructure: true } },
} as const;

// Tableaux de bord des autorités sanitaires (ROADMAP_ESPACE_AUTORITES.md,
// étape 3). Toutes les lectures passent par le ressort de l'autorité
// (RapportsStatistiquesService.ressort) : uniquement des rapports soumis ou
// validés de son ressort, jamais un brouillon.
@Injectable()
export class AutoriteStatistiquesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rapports: RapportsStatistiquesService,
  ) {}

  // ---------------------------------------------------------------------------
  // Établissements du ressort
  // ---------------------------------------------------------------------------

  async etablissements(user: JwtAccessPayload) {
    const autorite = await this.rapports.exigerAutorite(user);
    const localises = await this.etablissementsLocalises(autorite);
    const rapports = await this.prisma.rapportStatistique.findMany({
      where: this.rapports.ressort(autorite),
      select: { organisationId: true, statut: true, soumisLe: true, formulaireCode: true },
    });

    // Établissements ayant transmis dans le ressort sans y être (ou plus) localisés.
    const connus = new Set(localises.map((o) => o.id));
    const autresIds = [...new Set(rapports.map((r) => r.organisationId))].filter((id) => !connus.has(id));
    const autres = autresIds.length
      ? await this.prisma.organisation.findMany({ where: { id: { in: autresIds } }, select: SELECTION_ETABLISSEMENT })
      : [];

    return [...localises.map((o) => ({ o, localise: true })), ...autres.map((o) => ({ o, localise: false }))]
      .map(({ o, localise }) => {
        const siens = rapports.filter((r) => r.organisationId === o.id);
        const derniere = siens.reduce<Date | null>((d, r) => (r.soumisLe && (!d || r.soumisLe > d) ? r.soumisLe : d), null);
        return {
          ...o,
          localiseDansRessort: localise,
          rapports: {
            total: siens.length,
            soumis: siens.filter((r) => r.statut === StatutRapportStatistique.SOUMIS).length,
            valides: siens.filter((r) => r.statut === StatutRapportStatistique.VALIDE).length,
          },
          formulaires: [...new Set(siens.map((r) => r.formulaireCode))],
          derniereSoumission: derniere,
        };
      })
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }

  // ---------------------------------------------------------------------------
  // Synthèse (tableau de bord)
  // ---------------------------------------------------------------------------

  async synthese(f: FiltresAutoriteDto, user: JwtAccessPayload) {
    const autorite = await this.rapports.exigerAutorite(user);
    const rapports = await this.rapportsFiltres(autorite, f);
    const etablissements = this.filtrerEtablissements(await this.etablissementsLocalises(autorite), f);

    const aValider = rapports.filter((r) => r.statut === StatutRapportStatistique.SOUMIS);
    const valides = rapports.filter((r) => r.statut === StatutRapportStatistique.VALIDE);

    const parMois = new Map<string, { soumis: number; valides: number }>();
    for (const r of rapports) {
      if (!r.soumisLe) continue;
      const m = moisDe(r.soumisLe);
      const ligne = parMois.get(m) ?? { soumis: 0, valides: 0 };
      ligne.soumis += 1;
      if (r.statut === StatutRapportStatistique.VALIDE) ligne.valides += 1;
      parMois.set(m, ligne);
    }

    const finPeriodeSoumission: number[] = [];
    const soumissionReception: number[] = [];
    const soumissionValidation: number[] = [];
    for (const r of rapports) {
      if (!r.soumisLe) continue;
      const bornes = bornesPeriode(this.definition(r.formulaireCode).periodicite, r.periode);
      // Fin de période = fin du dernier jour (le lendemain à 00:00 UTC).
      if (bornes) finPeriodeSoumission.push(joursEntre(new Date(bornes.fin.getTime() + JOUR_MS), r.soumisLe));
      if (r.recuLe) soumissionReception.push(joursEntre(r.soumisLe, r.recuLe));
      if (r.valideLe) soumissionValidation.push(joursEntre(r.soumisLe, r.valideLe));
    }

    return {
      totaux: {
        recus: rapports.length,
        aValider: aValider.length,
        valides: valides.length,
        nonOuverts: rapports.filter((r) => !r.recuLe).length,
        etablissementsRessort: etablissements.length,
        etablissementsAyantTransmis: new Set(rapports.map((r) => r.organisationId)).size,
      },
      parFormulaire: FORMULAIRES_STATISTIQUES.map((def) => {
        const siens = rapports.filter((r) => r.formulaireCode === def.code);
        return {
          code: def.code,
          recus: siens.length,
          aValider: siens.filter((r) => r.statut === StatutRapportStatistique.SOUMIS).length,
          valides: siens.filter((r) => r.statut === StatutRapportStatistique.VALIDE).length,
        };
      }),
      parMois: [...parMois.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mois, v]) => ({ mois, ...v })),
      delais: {
        finPeriodeSoumission: statistiqueDelai(finPeriodeSoumission),
        soumissionReception: statistiqueDelai(soumissionReception),
        soumissionValidation: statistiqueDelai(soumissionValidation),
      },
      aValiderListe: aValider
        .sort((a, b) => (a.soumisLe?.getTime() ?? 0) - (b.soumisLe?.getTime() ?? 0))
        .slice(0, 8),
      dernieresPeriodes: await this.dernieresPeriodes(autorite, etablissements.map((e) => e.id)),
    };
  }

  // Dernière période complète de chaque formulaire : établissements du
  // ressort ayant transmis (hors filtre de dates).
  private async dernieresPeriodes(autorite: Autorite, etablissementIds: string[]) {
    const maintenant = new Date();
    const cibles = FORMULAIRES_STATISTIQUES.map((def) => {
      const courante = periodeDeDate(def.periodicite, maintenant);
      const debut = bornesPeriode(def.periodicite, courante)!.debut;
      return { def, periode: periodeDeDate(def.periodicite, new Date(debut.getTime() - JOUR_MS)) };
    });
    const rapports = await this.prisma.rapportStatistique.findMany({
      where: {
        AND: [
          this.rapports.ressort(autorite),
          { OR: cibles.map((c) => ({ formulaireCode: c.def.code, periode: c.periode })) },
          { organisationId: { in: etablissementIds } },
        ],
      },
      select: { formulaireCode: true, periode: true, organisationId: true },
    });
    return cibles.map(({ def, periode }) => ({
      code: def.code,
      periode,
      transmis: new Set(rapports.filter((r) => r.formulaireCode === def.code && r.periode === periode).map((r) => r.organisationId)).size,
      etablissements: etablissementIds.length,
    }));
  }

  // ---------------------------------------------------------------------------
  // Suivi des transmissions : établissement × période
  // ---------------------------------------------------------------------------

  async transmissions(f: TransmissionsQueryDto, user: JwtAccessPayload) {
    const autorite = await this.rapports.exigerAutorite(user);
    const def = this.definition(f.formulaire);
    const maintenant = new Date();
    const au = dateUtc(f.au) ?? maintenant;
    const du =
      dateUtc(f.du) ?? new Date(au.getTime() - (def.periodicite === "MENSUELLE" ? 365 : 7 * 16) * JOUR_MS);
    // Périodes déjà commencées uniquement.
    const periodes = periodesEntre(def.periodicite, du, au).filter(
      (p) => bornesPeriode(def.periodicite, p)!.debut.getTime() <= maintenant.getTime(),
    );

    const rapports = await this.rapportsFiltres(autorite, { ...f, du: undefined, au: undefined });
    const dansPeriodes = rapports.filter((r) => periodes.includes(r.periode));
    const localises = this.filtrerEtablissements(await this.etablissementsLocalises(autorite), f);

    const lignes = new Map<string, { id: string; nom: string; commune: string | null; localiseDansRessort: boolean }>();
    for (const o of localises) lignes.set(o.id, { id: o.id, nom: o.nom, commune: o.commune, localiseDansRessort: true });
    for (const r of dansPeriodes) {
      if (!lignes.has(r.organisationId)) {
        lignes.set(r.organisationId, { id: r.organisationId, nom: r.organisation.nom, commune: r.organisation.commune, localiseDansRessort: false });
      }
    }

    const etablissements = [...lignes.values()]
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
      .map((e) => ({
        ...e,
        cellules: Object.fromEntries(
          periodes.map((p) => {
            const r = dansPeriodes.find((x) => x.organisationId === e.id && x.periode === p);
            return [p, r ? { id: r.id, statut: r.statut, soumisLe: r.soumisLe, recuLe: r.recuLe, valideLe: r.valideLe } : null];
          }),
        ),
      }));

    return {
      formulaire: def.code,
      periodicite: def.periodicite,
      periodes,
      etablissements,
      parPeriode: periodes.map((p) => ({
        periode: p,
        transmis: etablissements.filter((e) => e.cellules[p]).length,
        valides: etablissements.filter((e) => e.cellules[p]?.statut === StatutRapportStatistique.VALIDE).length,
        etablissementsLocalises: localises.length,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Données : valeurs d'indicateurs choisis, rapport par rapport
  // ---------------------------------------------------------------------------

  async donnees(f: DonneesQueryDto, user: JwtAccessPayload) {
    const autorite = await this.rapports.exigerAutorite(user);
    const def = this.definition(f.formulaire);
    const cles = [...new Set(liste(f.cles))];
    if (cles.length === 0) throw new BadRequestException("Aucun indicateur demandé");
    if (cles.length > MAX_CLES) throw new BadRequestException(`${MAX_CLES} indicateurs au maximum par requête`);
    const connues = new Set(indicateursFormulaire(def).map((i) => i.cle));
    const inconnues = cles.filter((c) => !connues.has(c));
    if (inconnues.length > 0) throw new BadRequestException(`Indicateur inconnu : ${inconnues.slice(0, 5).join(", ")}`);

    const rapports = await this.rapportsFiltres(autorite, f, true);
    return {
      formulaire: def.code,
      periodicite: def.periodicite,
      rapports: rapports
        .sort((a, b) => a.periode.localeCompare(b.periode) || a.organisation.nom.localeCompare(b.organisation.nom, "fr"))
        .map((r) => ({
          id: r.id,
          organisationId: r.organisationId,
          organisationNom: r.organisation.nom,
          commune: r.organisation.commune,
          periode: r.periode,
          statut: r.statut,
          valeurs: Object.fromEntries(cles.map((c) => [c, valeurIndicateur(def, c, (r.valeurs ?? {}) as Record<string, unknown>)])),
        })),
    };
  }

  // ---------------------------------------------------------------------------

  private definition(code: string): DefinitionFormulaire {
    const def = formulaireStatistique(code);
    if (!def) throw new BadRequestException("Formulaire inconnu");
    return def;
  }

  private async etablissementsLocalises(autorite: Autorite) {
    const where: Prisma.OrganisationWhereInput =
      autorite.niveau === NiveauAutorite.NATIONAL ? {} : { departement: autorite.departement ?? "__aucun__" };
    const orgs = await this.prisma.organisation.findMany({ where, select: SELECTION_ETABLISSEMENT });
    return orgs.filter((o) => etablissementDansRessort(autorite, o));
  }

  private filtrerEtablissements<T extends { id: string; commune: string | null; typeStructure: string | null }>(
    orgs: T[],
    f: FiltresAutoriteDto,
  ): T[] {
    const ids = liste(f.organisations);
    const communes = liste(f.communes);
    const structures = liste(f.structures);
    return orgs.filter(
      (o) =>
        (ids.length === 0 || ids.includes(o.id)) &&
        (communes.length === 0 || (o.commune !== null && communes.includes(o.commune))) &&
        (structures.length === 0 || (o.typeStructure !== null && structures.includes(o.typeStructure))),
    );
  }

  // Rapports du ressort correspondant aux filtres ; la période est filtrée
  // sur la date de début de la période du rapport.
  private async rapportsFiltres(autorite: Autorite, f: FiltresAutoriteDto, avecValeurs = false) {
    const structures = liste(f.structures);
    const inconnues = structures.filter((s) => !(s in TypeStructure));
    if (inconnues.length > 0) throw new BadRequestException(`Type de structure inconnu : ${inconnues.join(", ")}`);
    const ids = liste(f.organisations);
    const communes = liste(f.communes);
    const du = dateUtc(f.du);
    const au = dateUtc(f.au);
    if (du && au && du > au) throw new BadRequestException("La date de début est postérieure à la date de fin");

    const rapports = await this.prisma.rapportStatistique.findMany({
      where: {
        AND: [
          this.rapports.ressort(autorite),
          f.formulaire ? { formulaireCode: f.formulaire } : {},
          f.statut ? { statut: f.statut } : {},
          ids.length ? { organisationId: { in: ids } } : {},
          communes.length || structures.length
            ? {
                organisation: {
                  ...(communes.length ? { commune: { in: communes } } : {}),
                  ...(structures.length ? { typeStructure: { in: structures as TypeStructure[] } } : {}),
                },
              }
            : {},
        ],
      },
      select: { ...SELECTION_RAPPORT, valeurs: avecValeurs },
    });

    if (!du && !au) return rapports;
    return rapports.filter((r) => {
      const bornes = bornesPeriode(this.definition(r.formulaireCode).periodicite, r.periode);
      if (!bornes) return false;
      return (!du || bornes.debut >= du) && (!au || bornes.debut <= au);
    });
  }
}
