import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AbonnementsService } from "../abonnements/abonnements.service.js";
import { MailerService } from "../notifications/mailer.service.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { GraviteEi, ModuleMetier, RoleUtilisateur, StatutEi } from "../generated/prisma/enums.js";
import type { EvenementIndesirable } from "../generated/prisma/client.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";
import type { DeclarerEiDto } from "./dto/declarer-ei.dto.js";
import type { QualifierEiDto } from "./dto/qualifier-ei.dto.js";
import type { CreerCauseDto } from "./dto/creer-cause.dto.js";
import type { CreerActionCorrectiveDto } from "./dto/creer-action-corrective.dto.js";
import type { ChangerStatutActionDto } from "./dto/changer-statut-action.dto.js";
import type { ChangerStatutEiDto } from "./dto/changer-statut-ei.dto.js";
import type { ListEiQueryDto } from "./dto/list-ei-query.dto.js";
import type { ExportEiQueryDto } from "./dto/export-ei-query.dto.js";

// Ordre des statuts : une transition ne peut qu'avancer (pas de retour en arrière).
const ORDRE_STATUT: Record<StatutEi, number> = {
  [StatutEi.DECLARE]: 0,
  [StatutEi.EN_TRAITEMENT]: 1,
  [StatutEi.CLOTURE]: 2,
};

@Injectable()
export class EvenementsIndesirablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abonnements: AbonnementsService,
    private readonly mailer: MailerService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // 8.1 / 8.14 — déclaration large : tout compte organisation peut déclarer.
  async declarer(dto: DeclarerEiDto, user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    await this.abonnements.verifierAcces(organisationId, ModuleMetier.EI);

    return this.prisma.evenementIndesirable.create({
      data: {
        organisationId,
        declareParId: user.sub,
        description: dto.description,
        typeEiId: dto.typeEiId,
        serviceId: dto.serviceId ?? user.serviceId ?? undefined,
        critereId: dto.critereId,
      },
    });
  }

  async lister(query: ListEiQueryDto, user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    return this.prisma.evenementIndesirable.findMany({
      where: {
        organisationId,
        statut: query.statut,
        gravite: query.gravite,
        serviceId: query.serviceId,
        typeEiId: query.typeEiId,
      },
      include: { typeEi: true, service: true },
      orderBy: { dateDeclaration: "desc" },
    });
  }

  // 8.2 — file d'attente du responsable qualité (EI non encore qualifiés).
  async fileAttenteQualification(user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    return this.prisma.evenementIndesirable.findMany({
      where: { organisationId, gravite: null },
      include: { typeEi: true, service: true },
      orderBy: { dateDeclaration: "asc" },
    });
  }

  async obtenir(id: string, user: JwtAccessPayload) {
    const evenement = await this.prisma.evenementIndesirable.findUnique({
      where: { id },
      include: {
        typeEi: true,
        service: true,
        critere: true,
        declarePar: { select: { id: true, nom: true, prenom: true, email: true } },
        causes: { orderBy: { createdAt: "asc" } },
        actionsCorrectives: { orderBy: { createdAt: "asc" } },
        transitions: { orderBy: { createdAt: "asc" } },
        piecesJointes: { orderBy: { createdAt: "asc" } },
      },
    });
    this.verifierAppartenance(evenement, user);
    return evenement;
  }

  // 8.3 — qualification (gravité) par resp_qualite ; RM9 : alerte auto si gravité élevée.
  async qualifier(id: string, dto: QualifierEiDto, user: JwtAccessPayload) {
    const evenement = await this.prisma.evenementIndesirable.findUnique({ where: { id } });
    this.verifierAppartenance(evenement, user);

    const misAJour = await this.prisma.evenementIndesirable.update({
      where: { id },
      data: { gravite: dto.gravite },
    });

    if (dto.gravite === GraviteEi.ELEVEE) {
      await this.notifierGraviteElevee(misAJour);
    }

    return misAJour;
  }

  // 8.4 — analyse des causes (append-only, comme les mesures NEWS — RM4 par analogie).
  async ajouterCause(evenementId: string, dto: CreerCauseDto, user: JwtAccessPayload) {
    const evenement = await this.prisma.evenementIndesirable.findUnique({ where: { id: evenementId } });
    this.verifierAppartenance(evenement, user);
    return this.prisma.cause.create({
      data: { evenementId, type: dto.type, description: dto.description },
    });
  }

  // 8.5 — plan d'actions correctives.
  async ajouterActionCorrective(evenementId: string, dto: CreerActionCorrectiveDto, user: JwtAccessPayload) {
    const evenement = await this.prisma.evenementIndesirable.findUnique({ where: { id: evenementId } });
    this.verifierAppartenance(evenement, user);
    return this.prisma.actionCorrective.create({
      data: {
        evenementId,
        description: dto.description,
        responsableId: dto.responsableId,
        echeance: new Date(dto.echeance),
      },
    });
  }

  // 8.6 — suivi des actions.
  async changerStatutAction(evenementId: string, actionId: string, dto: ChangerStatutActionDto, user: JwtAccessPayload) {
    const evenement = await this.prisma.evenementIndesirable.findUnique({ where: { id: evenementId } });
    this.verifierAppartenance(evenement, user);

    const action = await this.prisma.actionCorrective.findUnique({ where: { id: actionId } });
    if (!action || action.evenementId !== evenementId) {
      throw new NotFoundException("Action corrective introuvable");
    }
    return this.prisma.actionCorrective.update({ where: { id: actionId }, data: { statut: dto.statut } });
  }

  // 8.7 / 8.8 — transition de statut, historisée (RM8).
  async changerStatut(id: string, dto: ChangerStatutEiDto, user: JwtAccessPayload) {
    const evenement = await this.prisma.evenementIndesirable.findUnique({ where: { id } });
    this.verifierAppartenance(evenement, user);

    if (ORDRE_STATUT[dto.statut] <= ORDRE_STATUT[evenement.statut]) {
      throw new ConflictException(
        `Transition invalide : un EI ${evenement.statut} ne peut pas repasser à ${dto.statut}`,
      );
    }

    const [misAJour] = await this.prisma.$transaction([
      this.prisma.evenementIndesirable.update({
        where: { id },
        data: {
          statut: dto.statut,
          dateCloture: dto.statut === StatutEi.CLOTURE ? new Date() : undefined,
        },
      }),
      this.prisma.evenementTransition.create({
        data: {
          evenementId: id,
          ancienStatut: evenement.statut,
          nouveauStatut: dto.statut,
          utilisateurId: user.sub,
        },
      }),
    ]);

    return misAJour;
  }

  // 8.13 — pièce jointe (upload Cloudinary, §11.1).
  async ajouterPieceJointe(
    evenementId: string,
    fichier: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    user: JwtAccessPayload,
  ) {
    const evenement = await this.prisma.evenementIndesirable.findUnique({ where: { id: evenementId } });
    this.verifierAppartenance(evenement, user);

    const { url, cloudinaryId } = await this.cloudinary.uploadBuffer(
      fichier.buffer,
      fichier.mimetype,
      fichier.originalname,
    );

    return this.prisma.pieceJointe.create({
      data: {
        evenementId,
        url,
        cloudinaryId,
        nomFichier: fichier.originalname,
        typeMime: fichier.mimetype,
        tailleOctets: fichier.size,
      },
    });
  }

  // 8.10 — tableau de bord.
  async tableauDeBord(user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    const evenements = await this.prisma.evenementIndesirable.findMany({
      where: { organisationId },
      select: {
        statut: true,
        gravite: true,
        serviceId: true,
        typeEiId: true,
        dateDeclaration: true,
        dateCloture: true,
      },
    });

    const parStatut: Record<string, number> = {};
    const parGravite: Record<string, number> = {};
    const parService: Record<string, number> = {};
    let sommeDelaisClotureJours = 0;
    let nombreClotures = 0;

    for (const e of evenements) {
      parStatut[e.statut] = (parStatut[e.statut] ?? 0) + 1;
      if (e.gravite) parGravite[e.gravite] = (parGravite[e.gravite] ?? 0) + 1;
      if (e.serviceId) parService[e.serviceId] = (parService[e.serviceId] ?? 0) + 1;
      if (e.dateCloture) {
        nombreClotures++;
        sommeDelaisClotureJours += (e.dateCloture.getTime() - e.dateDeclaration.getTime()) / 86_400_000;
      }
    }

    return {
      total: evenements.length,
      parStatut,
      parGravite,
      parService,
      tauxCloture: evenements.length ? Math.round((nombreClotures / evenements.length) * 10000) / 100 : 0,
      delaiMoyenClotureJours: nombreClotures ? Math.round((sommeDelaisClotureJours / nombreClotures) * 10) / 10 : null,
    };
  }

  // 8.11 — export sur période donnée.
  async exporter(query: ExportEiQueryDto, user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    return this.prisma.evenementIndesirable.findMany({
      where: {
        organisationId,
        dateDeclaration: {
          gte: query.debut ? new Date(query.debut) : undefined,
          lte: query.fin ? new Date(query.fin) : undefined,
        },
      },
      include: { typeEi: true, service: true, causes: true, actionsCorrectives: true },
      orderBy: { dateDeclaration: "asc" },
    });
  }

  private async notifierGraviteElevee(evenement: EvenementIndesirable): Promise<void> {
    const destinataires = await this.prisma.utilisateur.findMany({
      where: {
        organisationId: evenement.organisationId,
        actif: true,
        roles: { some: { role: { in: [RoleUtilisateur.RESP_QUALITE, RoleUtilisateur.RESPONSABLE_COMPTE] } } },
      },
      select: { email: true },
    });
    await Promise.all(destinataires.map((d) => this.mailer.sendAlerteEiGraviteElevee(d.email, evenement.id)));
  }

  private exigerOrganisation(user: JwtAccessPayload): string {
    if (!user.organisationId) {
      throw new ForbiddenException("Réservé aux comptes organisation");
    }
    return user.organisationId;
  }

  // RM7 — 404 (jamais 403) pour ne pas révéler l'existence d'un EI d'une autre organisation.
  private verifierAppartenance<T extends EvenementIndesirable | null>(
    evenement: T,
    user: JwtAccessPayload,
  ): asserts evenement is NonNullable<T> {
    if (!evenement || evenement.organisationId !== user.organisationId) {
      throw new NotFoundException("Événement indésirable introuvable");
    }
  }
}
