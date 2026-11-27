import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { MailerService } from "../../notifications/mailer.service.js";
import { StatutReservation, StatutSessionFormation } from "../../generated/prisma/enums.js";

const FUSEAU = "Africa/Porto-Novo";
export const formaterDateSession = (date: Date) =>
  date.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: FUSEAU });

// §4.4 — le lien Google Meet et le code ne sont envoyés qu'une fois le paiement
// confirmé et la session connue. Une invitation dont l'envoi échoue reste « à
// envoyer » (invitationEnvoyeeLe nul) et repart au prochain déclenchement.
@Injectable()
export class InvitationsFormationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  // `renvoyer` : toutes les invitations repartent (lien, code ou horaire modifiés).
  async envoyerPourReservation(reservationId: string, options: { renvoyer?: boolean } = {}): Promise<number> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { formation: { select: { titre: true } }, sessionFormation: true, participants: true },
    });
    const session = reservation?.sessionFormation;
    if (!reservation || !session || session.statut !== StatutSessionFormation.PLANIFIEE) return 0;
    if (reservation.statut !== StatutReservation.PAYEE && reservation.statut !== StatutReservation.CONFIRMEE) return 0;

    let envoyees = 0;
    for (const participant of reservation.participants) {
      if (participant.invitationEnvoyeeLe && !options.renvoyer) continue;
      const ok = await this.mailer.sendInvitationSessionFormation({
        email: participant.email,
        prenom: participant.prenom,
        nom: participant.nom,
        formation: reservation.formation.titre,
        debut: formaterDateSession(session.debut),
        fin: formaterDateSession(session.fin),
        lienMeet: session.lienMeet,
        codeMeet: session.codeMeet,
      });
      await this.prisma.participantFormation.update({
        where: { id: participant.id },
        data: { invitationEnvoyeeLe: ok ? new Date() : null },
      });
      if (ok) envoyees++;
    }
    return envoyees;
  }

  async envoyerPourSession(sessionId: string, options: { renvoyer?: boolean } = {}): Promise<number> {
    const reservations = await this.prisma.reservation.findMany({
      where: { sessionFormationId: sessionId },
      select: { id: true },
    });
    let total = 0;
    for (const r of reservations) total += await this.envoyerPourReservation(r.id, options);
    return total;
  }
}
