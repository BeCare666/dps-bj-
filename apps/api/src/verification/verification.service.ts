import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { StatutSessionEvaluation, type SourceEvaluationExterne, type TypeEtablissement } from "../generated/prisma/enums.js";
import { calculerNiveauArs, categorieDeGrille, type PourcentagesArs } from "./niveau-ars.util.js";
import type { CreerEvaluationExterneDto, LierEvaluationExterneDto } from "./dto/verification.dto.js";

const MAX_RESULTATS = 20;

export interface NiveauAutoEvaluation extends PourcentagesArs {
  niveau: number | null;
  // Soumission la plus récente parmi les auto-évaluations retenues.
  date: Date | null;
}

export interface ResultatVerification {
  nom: string;
  typeEtablissement: TypeEtablissement;
  ville: string | null;
  source: "AUTO_EVALUATION" | SourceEvaluationExterne;
  niveau: number | null;
  date: Date | null;
  pctEssentiels: number | null;
  pctFondamentaux: number | null;
  pctAvances: number | null;
  inscritSurDsp: boolean;
}

type SessionSoumise = { organisationId: string; scoreGlobal: number | null; dateSoumission: Date | null; grille: { nom: string } };

// §5 — niveau ARS des établissements : auto-évaluations soumises sur DSP et
// évaluations ARS / Ministère enregistrées par DSP sur justificatif.
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // §5.1 — dernière auto-évaluation soumise de chaque catégorie (essentiels,
  // fondamentaux, avancés) des grilles du type de l'établissement.
  async niveauxAutoEvaluation(organisations: { id: string; type: TypeEtablissement }[]) {
    const sessions: SessionSoumise[] = organisations.length
      ? await this.prisma.sessionEvaluation.findMany({
          where: { organisationId: { in: organisations.map((o) => o.id) }, statut: StatutSessionEvaluation.SOUMISE },
          select: { organisationId: true, scoreGlobal: true, dateSoumission: true, grille: { select: { nom: true, type: true } } },
          orderBy: { dateSoumission: "desc" },
        })
      : [];
    const resultat = new Map<string, NiveauAutoEvaluation>();
    for (const org of organisations) {
      const dernieres = new Map<string, SessionSoumise>();
      for (const s of sessions) {
        if (s.organisationId !== org.id) continue;
        const categorie = categorieDeGrille(s.grille.nom);
        if (categorie && !dernieres.has(categorie)) dernieres.set(categorie, s);
      }
      const pct = (c: string) => dernieres.get(c)?.scoreGlobal ?? null;
      const pourcentages = { essentiels: pct("ESSENTIEL"), fondamentaux: pct("FONDAMENTAL"), avances: pct("AVANCE") };
      const dates = [...dernieres.values()].map((s) => s.dateSoumission?.getTime() ?? 0).filter(Boolean);
      resultat.set(org.id, {
        ...pourcentages,
        niveau: calculerNiveauArs(pourcentages),
        date: dates.length ? new Date(Math.max(...dates)) : null,
      });
    }
    return resultat;
  }

  // §11.1 — niveau de l'établissement connecté et évaluations externes connues.
  async pourOrganisation(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({ where: { id: organisationId }, select: { id: true, type: true } });
    if (!organisation) throw new NotFoundException("Organisation introuvable");
    const autoEvaluation = (await this.niveauxAutoEvaluation([organisation])).get(organisation.id)!;
    const evaluationsExternes = await this.prisma.evaluationExterne.findMany({
      where: { organisationId },
      select: { id: true, source: true, niveau: true, dateEvaluation: true, pctEssentiels: true, pctFondamentaux: true, pctAvances: true },
      orderBy: { dateEvaluation: "desc" },
    });
    return { autoEvaluation, evaluationsExternes };
  }

  // §5.2 — recherche publique par nom, la plus récente en premier. Un
  // établissement inscrit sans auto-évaluation soumise apparaît sans niveau.
  async rechercher(q: string): Promise<ResultatVerification[]> {
    const terme = q.trim();
    const [organisations, externes] = await Promise.all([
      this.prisma.organisation.findMany({
        where: { actif: true, nom: { contains: terme } },
        select: { id: true, nom: true, type: true, ville: true },
        take: MAX_RESULTATS,
      }),
      this.prisma.evaluationExterne.findMany({
        where: { OR: [{ nomEtablissement: { contains: terme } }, { organisation: { nom: { contains: terme } } }] },
        include: { organisation: { select: { nom: true, type: true, ville: true } } },
        orderBy: { dateEvaluation: "desc" },
        take: MAX_RESULTATS,
      }),
    ]);
    const niveaux = await this.niveauxAutoEvaluation(organisations);
    const resultats: ResultatVerification[] = organisations.map((o) => {
      const n = niveaux.get(o.id)!;
      return {
        nom: o.nom,
        typeEtablissement: o.type,
        ville: o.ville,
        source: "AUTO_EVALUATION",
        niveau: n.niveau,
        date: n.date,
        pctEssentiels: n.essentiels,
        pctFondamentaux: n.fondamentaux,
        pctAvances: n.avances,
        inscritSurDsp: true,
      };
    });
    for (const e of externes) {
      resultats.push({
        nom: e.organisation?.nom ?? e.nomEtablissement,
        typeEtablissement: e.organisation?.type ?? e.typeEtablissement,
        ville: e.organisation?.ville ?? e.ville,
        source: e.source,
        niveau: e.niveau,
        date: e.dateEvaluation,
        pctEssentiels: e.pctEssentiels,
        pctFondamentaux: e.pctFondamentaux,
        pctAvances: e.pctAvances,
        inscritSurDsp: e.organisationId !== null,
      });
    }
    return resultats.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  }

  // §5.3 — administration DSP des évaluations externes.
  async listerExternes() {
    return this.prisma.evaluationExterne.findMany({
      include: {
        organisation: { select: { id: true, nom: true, ifu: true } },
        saisiePar: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: { dateEvaluation: "desc" },
    });
  }

  async creerExterne(
    dto: CreerEvaluationExterneDto,
    fichier: { buffer: Buffer; mimetype: string; originalname: string },
    saisieParId: string,
  ) {
    const ifu = dto.ifu?.trim() || null;
    const organisationId = dto.organisationId
      ? (await this.exigerOrganisation(dto.organisationId)).id
      : ifu
        ? ((await this.prisma.organisation.findUnique({ where: { ifu }, select: { id: true } }))?.id ?? null)
        : null;
    const { url, cloudinaryId } = await this.cloudinary.uploadBuffer(
      fichier.buffer,
      fichier.mimetype,
      fichier.originalname,
      "dps-bj/evaluations-externes",
    );
    return this.prisma.evaluationExterne.create({
      data: {
        organisationId,
        nomEtablissement: dto.nomEtablissement.trim(),
        typeEtablissement: dto.typeEtablissement,
        ville: dto.ville?.trim() || null,
        ifu,
        source: dto.source,
        niveau: dto.niveau,
        dateEvaluation: new Date(dto.dateEvaluation),
        pctEssentiels: dto.pctEssentiels ?? null,
        pctFondamentaux: dto.pctFondamentaux ?? null,
        pctAvances: dto.pctAvances ?? null,
        reference: dto.reference?.trim() || null,
        documentUrl: url,
        documentCloudinaryId: cloudinaryId,
        documentNom: fichier.originalname,
        saisieParId,
      },
    });
  }

  async lierExterne(id: string, dto: LierEvaluationExterneDto) {
    await this.exigerExterne(id);
    const organisationId = dto.organisationId ? (await this.exigerOrganisation(dto.organisationId)).id : null;
    return this.prisma.evaluationExterne.update({ where: { id }, data: { organisationId } });
  }

  async supprimerExterne(id: string) {
    const evaluation = await this.exigerExterne(id);
    await this.prisma.evaluationExterne.delete({ where: { id } });
    try {
      await this.cloudinary.supprimer(evaluation.documentCloudinaryId);
    } catch (e) {
      this.logger.warn(`Suppression Cloudinary impossible (${evaluation.documentCloudinaryId}) : ${(e as Error).message}`);
    }
  }

  private async exigerExterne(id: string) {
    const evaluation = await this.prisma.evaluationExterne.findUnique({ where: { id } });
    if (!evaluation) throw new NotFoundException("Évaluation introuvable");
    return evaluation;
  }

  private async exigerOrganisation(id: string) {
    const organisation = await this.prisma.organisation.findUnique({ where: { id }, select: { id: true } });
    if (!organisation) throw new BadRequestException("Organisation introuvable");
    return organisation;
  }
}
