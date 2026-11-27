import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { NotificationsInternesService } from "../../notifications-internes/notifications-internes.service.js";
import { MailerService } from "../../notifications/mailer.service.js";
import { StatutReservation, StatutSessionFormation } from "../../generated/prisma/enums.js";
import { InvitationsFormationService, formaterDateSession } from "./invitations-formation.service.js";
import type {
  CreerSessionFormationDto,
  EnregistrerPresencesDto,
  ListSessionsFormationQueryDto,
  ModifierSessionFormationDto,
} from "./dto/session-formation.dto.js";

// Réservations rattachées à une session : celles qui comptent (ni annulées ni en
// attente de paiement abandonnée) occupent des places.
const STATUTS_ACTIFS = [StatutReservation.ATTENTE_PAIEMENT, StatutReservation.PAYEE, StatutReservation.CONFIRMEE, StatutReservation.REALISEE];

// §4.1, §4.5 — sessions en ligne (Google Meet) planifiées par DSP, feuille de
// présence et clôture.
@Injectable()
export class SessionsFormationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitations: InvitationsFormationService,
    private readonly mailer: MailerService,
    private readonly notificationsInternes: NotificationsInternesService,
  ) {}

  async lister(query: ListSessionsFormationQueryDto) {
    const sessions = await this.prisma.sessionFormation.findMany({
      where: { formationId: query.formationId, statut: query.statut },
      include: {
        formation: { select: { id: true, titre: true, typeEtablissement: true, critere: true } },
        reservations: {
          where: { statut: { in: STATUTS_ACTIFS } },
          select: { id: true, statut: true, _count: { select: { participants: true } } },
        },
      },
      orderBy: { debut: "desc" },
    });
    return sessions.map(({ reservations, ...s }) => ({
      ...s,
      nombreReservations: reservations.length,
      nombreParticipants: reservations.reduce((n, r) => n + r._count.participants, 0),
    }));
  }

  // Feuille de présence : réservations, établissements et participants.
  async obtenir(id: string) {
    const session = await this.prisma.sessionFormation.findUnique({
      where: { id },
      include: {
        formation: { select: { id: true, titre: true, typeEtablissement: true, critere: true, dureeLibelle: true } },
        reservations: {
          where: { statut: { in: STATUTS_ACTIFS } },
          include: {
            organisation: { select: { id: true, nom: true } },
            utilisateur: { select: { id: true, nom: true, prenom: true, email: true } },
            participants: { orderBy: [{ nom: "asc" }, { prenom: "asc" }] },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!session) throw new NotFoundException("Session introuvable");
    return session;
  }

  async creer(dto: CreerSessionFormationDto) {
    const formation = await this.prisma.formation.findUnique({ where: { id: dto.formationId } });
    if (!formation) throw new NotFoundException("Formation introuvable");
    const { debut, fin } = this.verifierHoraire(new Date(dto.debut), new Date(dto.fin));
    return this.prisma.sessionFormation.create({
      data: {
        formationId: formation.id,
        debut,
        fin,
        lienMeet: dto.lienMeet,
        codeMeet: dto.codeMeet || null,
        placesMax: dto.placesMax ?? null,
      },
    });
  }

  // Un changement de lien, de code ou d'horaire renvoie les invitations ; la
  // date de RDV des réservations suit le début de la session.
  async modifier(id: string, dto: ModifierSessionFormationDto) {
    const session = await this.exigerPlanifiee(id);
    const { debut, fin } = this.verifierHoraire(
      dto.debut ? new Date(dto.debut) : session.debut,
      dto.fin ? new Date(dto.fin) : session.fin,
    );
    if (dto.placesMax) {
      const inscrits = await this.compterParticipants(id);
      if (dto.placesMax < inscrits) {
        throw new BadRequestException(`${inscrits} participant(s) déjà inscrit(s) : places insuffisantes`);
      }
    }
    const codeMeet = dto.codeMeet === undefined ? session.codeMeet : dto.codeMeet || null;
    const lienMeet = dto.lienMeet ?? session.lienMeet;
    const changementInvitation =
      lienMeet !== session.lienMeet ||
      codeMeet !== session.codeMeet ||
      debut.getTime() !== session.debut.getTime() ||
      fin.getTime() !== session.fin.getTime();

    const misAJour = await this.prisma.$transaction(async (tx) => {
      const maj = await tx.sessionFormation.update({
        where: { id },
        data: { debut, fin, lienMeet, codeMeet, placesMax: dto.placesMax === undefined ? undefined : dto.placesMax },
      });
      if (debut.getTime() !== session.debut.getTime()) {
        await tx.reservation.updateMany({
          where: { sessionFormationId: id, statut: StatutReservation.CONFIRMEE },
          data: { dateRdv: debut, rappelEnvoyeLe: null },
        });
      }
      return maj;
    });
    if (changementInvitation) await this.invitations.envoyerPourSession(id, { renvoyer: true });
    return misAJour;
  }

  // Les réservations repassent « payées, session à affecter » et leurs titulaires
  // sont prévenus ; DSP les affecte ensuite à une autre session.
  async annuler(id: string) {
    const session = await this.exigerPlanifiee(id);
    const reservations = await this.prisma.reservation.findMany({
      where: { sessionFormationId: id },
      include: { formation: { select: { titre: true } }, utilisateur: { select: { id: true, email: true } } },
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.sessionFormation.update({ where: { id }, data: { statut: StatutSessionFormation.ANNULEE } });
      await tx.reservation.updateMany({
        where: { sessionFormationId: id, statut: StatutReservation.CONFIRMEE },
        data: { statut: StatutReservation.PAYEE, dateRdv: null, rappelEnvoyeLe: null },
      });
      await tx.reservation.updateMany({ where: { sessionFormationId: id }, data: { sessionFormationId: null } });
      await tx.participantFormation.updateMany({
        where: { reservationId: { in: reservations.map((r) => r.id) } },
        data: { invitationEnvoyeeLe: null },
      });
    });
    for (const r of reservations) {
      if (r.statut !== StatutReservation.PAYEE && r.statut !== StatutReservation.CONFIRMEE) continue;
      const message = `La session du ${formaterDateSession(session.debut)} de la formation « ${r.formation.titre} » est annulée. Une nouvelle session vous sera proposée.`;
      await this.mailer.sendNotificationGenerique(r.utilisateur.email, message);
      await this.notificationsInternes.creerPour([r.utilisateur.id], {
        type: "FORMATION",
        message,
        titre: "Session de formation annulée",
        lienUrl: `/mes-reservations/${r.id}`,
      });
    }
    return this.prisma.sessionFormation.findUniqueOrThrow({ where: { id } });
  }

  async enregistrerPresences(id: string, dto: EnregistrerPresencesDto) {
    await this.exigerPlanifiee(id);
    const ids = dto.presences.map((p) => p.participantId);
    const participants = await this.prisma.participantFormation.findMany({
      where: { id: { in: ids }, reservation: { sessionFormationId: id } },
      select: { id: true },
    });
    if (participants.length !== new Set(ids).size) {
      throw new BadRequestException("Participant inconnu pour cette session");
    }
    await this.prisma.$transaction(
      dto.presences.map((p) =>
        this.prisma.participantFormation.update({ where: { id: p.participantId }, data: { present: p.present } }),
      ),
    );
    return this.obtenir(id);
  }

  // Clôture : un participant non coché est absent ; chaque réservation confirmée
  // passe « réalisée » avec le nombre de présents.
  async cloturer(id: string) {
    const session = await this.exigerPlanifiee(id);
    if (session.debut > new Date()) throw new ConflictException("La session n'a pas encore commencé");
    const reservations = await this.prisma.reservation.findMany({
      where: { sessionFormationId: id, statut: StatutReservation.CONFIRMEE },
      include: { participants: { select: { present: true } } },
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.participantFormation.updateMany({
        where: { reservation: { sessionFormationId: id }, present: null },
        data: { present: false },
      });
      for (const r of reservations) {
        const presents = r.participants.filter((p) => p.present === true).length;
        await tx.reservation.update({
          where: { id: r.id },
          data: { statut: StatutReservation.REALISEE, participantsPresents: presents, presenceConfirmee: presents > 0 },
        });
      }
      await tx.sessionFormation.update({
        where: { id },
        data: { statut: StatutSessionFormation.TERMINEE, clotureeLe: new Date() },
      });
    });
    return this.obtenir(id);
  }

  async compterParticipants(sessionId: string): Promise<number> {
    return this.prisma.participantFormation.count({
      where: { reservation: { sessionFormationId: sessionId, statut: { in: STATUTS_ACTIFS } } },
    });
  }

  private async exigerPlanifiee(id: string) {
    const session = await this.prisma.sessionFormation.findUnique({ where: { id } });
    if (!session) throw new NotFoundException("Session introuvable");
    if (session.statut !== StatutSessionFormation.PLANIFIEE) {
      throw new ConflictException(`Session ${session.statut === StatutSessionFormation.TERMINEE ? "terminée" : "annulée"}`);
    }
    return session;
  }

  private verifierHoraire(debut: Date, fin: Date) {
    if (fin <= debut) throw new BadRequestException("La fin de la session doit suivre son début");
    return { debut, fin };
  }
}
