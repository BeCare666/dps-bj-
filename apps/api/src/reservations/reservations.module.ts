import { Module } from "@nestjs/common";
import { ReservationsService } from "./reservations.service.js";
import { ReservationsController } from "./reservations.controller.js";
import { PaiementsWebhookController } from "./paiements-webhook.controller.js";

@Module({
  controllers: [ReservationsController, PaiementsWebhookController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
