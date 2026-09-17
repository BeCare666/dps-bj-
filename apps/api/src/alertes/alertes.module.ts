import { Module } from "@nestjs/common";
import { AlertesService } from "./alertes.service.js";
import { AlertesController } from "./alertes.controller.js";

@Module({
  controllers: [AlertesController],
  providers: [AlertesService],
})
export class AlertesModule {}
