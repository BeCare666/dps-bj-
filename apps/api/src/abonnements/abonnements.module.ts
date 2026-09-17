import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AbonnementsService } from "./abonnements.service.js";
import { AbonnementsController } from "./abonnements.controller.js";
import { ExpirationEssaisScheduler } from "./expiration-essais.scheduler.js";

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AbonnementsController],
  providers: [AbonnementsService, ExpirationEssaisScheduler],
  exports: [AbonnementsService],
})
export class AbonnementsModule {}
