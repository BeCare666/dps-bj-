import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { PatientsService } from "./patients.service.js";
import { CreatePatientDto } from "./dto/create-patient.dto.js";
import { SaisirMesureDto } from "./dto/saisir-mesure.dto.js";
import { ListPatientsQueryDto } from "./dto/list-patients-query.dto.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { RoleUtilisateur } from "../generated/prisma/enums.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";

// 7.10 — module NEWS réservé au personnel soignant et à l'encadrement qualité.
@Roles(RoleUtilisateur.PERSONNEL_SOIGNANT, RoleUtilisateur.RESP_QUALITE, RoleUtilisateur.RESPONSABLE_COMPTE)
@Controller("patients")
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  creer(@Body() dto: CreatePatientDto, @CurrentUser() user: JwtAccessPayload) {
    return this.patientsService.creer(dto, user);
  }

  @Get()
  lister(@Query() query: ListPatientsQueryDto, @CurrentUser() user: JwtAccessPayload) {
    return this.patientsService.lister(query, user);
  }

  @Get(":id")
  obtenir(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.patientsService.obtenir(id, user);
  }

  @Post(":id/cloturer")
  cloturer(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.patientsService.cloturer(id, user);
  }

  @Post(":id/mesures")
  saisirMesure(@Param("id") id: string, @Body() dto: SaisirMesureDto, @CurrentUser() user: JwtAccessPayload) {
    return this.patientsService.saisirMesure(id, dto, user);
  }

  @Get(":id/mesures")
  historiqueMesures(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.patientsService.historiqueMesures(id, user);
  }

  @Get(":id/export")
  exporter(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.patientsService.exporter(id, user);
  }
}
