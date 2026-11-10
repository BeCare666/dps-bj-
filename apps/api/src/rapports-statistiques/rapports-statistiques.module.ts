import { Module } from "@nestjs/common";
import { RapportsStatistiquesService } from "./rapports-statistiques.service.js";
import { AutoriteStatistiquesService } from "./autorite-statistiques.service.js";
import { AutoriteRapportsController, RapportsStatistiquesController } from "./rapports-statistiques.controller.js";

@Module({
  controllers: [RapportsStatistiquesController, AutoriteRapportsController],
  providers: [RapportsStatistiquesService, AutoriteStatistiquesService],
})
export class RapportsStatistiquesModule {}
