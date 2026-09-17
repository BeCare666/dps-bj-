import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AbonnementsService } from "../abonnements/abonnements.service.js";
import { MailerService } from "../notifications/mailer.service.js";
import { ModuleMetier, NiveauRisqueNews, RoleUtilisateur, StatutPatient } from "../generated/prisma/enums.js";
import type { Patient } from "../generated/prisma/client.js";
import { calculerScoreNews } from "./news-scoring.util.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";
import type { CreatePatientDto } from "./dto/create-patient.dto.js";
import type { SaisirMesureDto } from "./dto/saisir-mesure.dto.js";
import type { ListPatientsQueryDto } from "./dto/list-patients-query.dto.js";

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abonnements: AbonnementsService,
    private readonly mailer: MailerService,
  ) {}

  async creer(dto: CreatePatientDto, user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    await this.abonnements.verifierAcces(organisationId, ModuleMetier.NEWS);

    const serviceId = dto.serviceId ?? user.serviceId ?? undefined;
    return this.prisma.patient.create({
      data: {
        organisationId,
        serviceId,
        nom: dto.nom,
        prenom: dto.prenom,
        dateNaissance: dto.dateNaissance ? new Date(dto.dateNaissance) : undefined,
        sexe: dto.sexe,
        numeroDossier: dto.numeroDossier,
      },
    });
  }

  // 7.10 — filtrage par service pour le personnel soignant affecté à un service ;
  // vue globale de l'organisation pour resp_qualite / responsable_compte.
  async lister(query: ListPatientsQueryDto, user: JwtAccessPayload) {
    const organisationId = this.exigerOrganisation(user);
    const restreintAUnService = user.roles.includes(RoleUtilisateur.PERSONNEL_SOIGNANT) && !this.aRoleSupervision(user);

    return this.prisma.patient.findMany({
      where: {
        organisationId,
        statut: query.statut,
        serviceId: query.serviceId ?? (restreintAUnService ? (user.serviceId ?? undefined) : undefined),
      },
      orderBy: { dateAdmission: "desc" },
    });
  }

  async obtenir(id: string, user: JwtAccessPayload) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    this.verifierAppartenance(patient, user);
    return patient;
  }

  // 7.2 — clôture de fiche patient (sortie), conservation de l'historique.
  async cloturer(id: string, user: JwtAccessPayload) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    this.verifierAppartenance(patient, user);
    if (patient.statut === StatutPatient.SORTI) {
      throw new ConflictException("Ce patient est déjà sorti");
    }
    return this.prisma.patient.update({
      where: { id },
      data: { statut: StatutPatient.SORTI, dateSortie: new Date() },
    });
  }

  // RM (équivalent NEWS) — calcul du score et déclenchement d'alerte côté serveur uniquement (RM9).
  async saisirMesure(patientId: string, dto: SaisirMesureDto, user: JwtAccessPayload) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    this.verifierAppartenance(patient, user);
    await this.abonnements.verifierAcces(patient.organisationId, ModuleMetier.NEWS);
    if (patient.statut === StatutPatient.SORTI) {
      throw new ConflictException("Patient sorti, saisie de mesure impossible");
    }

    const { scoreTotal, niveauRisque } = calculerScoreNews(dto);

    const { mesure, alerteCreee } = await this.prisma.$transaction(async (tx) => {
      const mesureCreee = await tx.mesureNews.create({
        data: {
          patientId,
          saisieParId: user.sub,
          frequenceRespiratoire: dto.frequenceRespiratoire,
          saturationOxygene: dto.saturationOxygene,
          oxygenoSupplementation: dto.oxygenoSupplementation,
          temperature: dto.temperature,
          pressionArterielleSystolique: dto.pressionArterielleSystolique,
          frequenceCardiaque: dto.frequenceCardiaque,
          niveauConscience: dto.niveauConscience,
          scoreTotal,
          niveauRisque,
        },
      });

      if (niveauRisque === NiveauRisqueNews.BAS) {
        return { mesure: mesureCreee, alerteCreee: false };
      }

      await tx.alerte.create({
        data: {
          organisationId: patient.organisationId,
          patientId,
          mesureId: mesureCreee.id,
          niveauRisque,
        },
      });
      return { mesure: mesureCreee, alerteCreee: true };
    });

    if (alerteCreee) {
      await this.notifierAlerte(patient, niveauRisque);
    }

    return mesure;
  }

  // 7.8 — historique / courbe par patient.
  async historiqueMesures(patientId: string, user: JwtAccessPayload) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    this.verifierAppartenance(patient, user);
    return this.prisma.mesureNews.findMany({ where: { patientId }, orderBy: { dateMesure: "asc" } });
  }

  // 7.9 — export des données (JSON) ; le rendu PDF/impression formaté est un
  // sujet frontend (section 10), pas dupliqué ici.
  async exporter(patientId: string, user: JwtAccessPayload) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { mesures: { orderBy: { dateMesure: "asc" } }, alertes: true },
    });
    this.verifierAppartenance(patient, user);
    return patient;
  }

  private aRoleSupervision(user: JwtAccessPayload): boolean {
    return (
      user.roles.includes(RoleUtilisateur.RESP_QUALITE) || user.roles.includes(RoleUtilisateur.RESPONSABLE_COMPTE)
    );
  }

  private async notifierAlerte(patient: Patient, niveauRisque: NiveauRisqueNews): Promise<void> {
    const destinataires = await this.prisma.utilisateur.findMany({
      where: {
        organisationId: patient.organisationId,
        actif: true,
        roles: { some: { role: { in: [RoleUtilisateur.RESP_QUALITE, RoleUtilisateur.RESPONSABLE_COMPTE] } } },
      },
      select: { email: true },
    });

    const nomComplet = `${patient.prenom} ${patient.nom}`;
    await Promise.all(destinataires.map((d) => this.mailer.sendAlerteNewsEmail(d.email, nomComplet, niveauRisque)));
  }

  private exigerOrganisation(user: JwtAccessPayload): string {
    if (!user.organisationId) {
      throw new ForbiddenException("Réservé aux comptes organisation");
    }
    return user.organisationId;
  }

  // RM7 — isolation stricte par organisation_id : 404 (jamais 403) pour ne pas
  // révéler l'existence d'un patient d'une autre organisation.
  private verifierAppartenance<T extends Patient | null>(
    patient: T,
    user: JwtAccessPayload,
  ): asserts patient is NonNullable<T> {
    if (!patient || patient.organisationId !== user.organisationId) {
      throw new NotFoundException("Patient introuvable");
    }
  }
}
