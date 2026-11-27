import { Module } from "@nestjs/common";
import { ReservationsService } from "./reservations.service.js";
import { ReservationsController } from "./reservations.controller.js";
import { PaiementsWebhookController } from "./paiements-webhook.controller.js";
import { AbonnementsModule } from "../abonnements/abonnements.module.js";
import { InvitationsFormationService } from "./sessions/invitations-formation.service.js";
import { SessionsFormationService } from "./sessions/sessions-formation.service.js";
import { ParticipantsFormationService } from "./sessions/participants-formation.service.js";
import { ParticipantsFormationController, SessionsFormationController } from "./sessions/sessions-formation.controller.js";

@Module({
  imports: [AbonnementsModule],
  // Participants avant réservations : `:reservationId/participants` ne doit pas
  // être capté par une route plus générale.
  controllers: [ParticipantsFormationController, SessionsFormationController, ReservationsController, PaiementsWebhookController],
  providers: [ReservationsService, InvitationsFormationService, SessionsFormationService, ParticipantsFormationService],
})
export class ReservationsModule {}
