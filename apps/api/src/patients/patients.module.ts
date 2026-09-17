import { Module } from "@nestjs/common";
import { PatientsService } from "./patients.service.js";
import { PatientsController } from "./patients.controller.js";
import { AbonnementsModule } from "../abonnements/abonnements.module.js";

@Module({
  imports: [AbonnementsModule],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
