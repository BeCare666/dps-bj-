import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { Roles } from "../../auth/decorators/roles.decorator.js";
import { CurrentUser } from "../../auth/decorators/current-user.decorator.js";
import { RoleUtilisateur } from "../../generated/prisma/enums.js";
import type { JwtAccessPayload } from "../../auth/types/jwt-payload.type.js";
import { SessionsFormationService } from "./sessions-formation.service.js";
import { ParticipantsFormationService } from "./participants-formation.service.js";
import {
  AjouterParticipantDto,
  CreerSessionFormationDto,
  EnregistrerPresencesDto,
  ListSessionsFormationQueryDto,
  ModifierSessionFormationDto,
} from "./dto/session-formation.dto.js";

// §4.1, §4.5 — sessions en ligne, administrées par DSP.
@Roles(RoleUtilisateur.ADMIN_PLATEFORME)
@Controller("sessions-formation")
export class SessionsFormationController {
  constructor(private readonly sessions: SessionsFormationService) {}

  @Get()
  lister(@Query() query: ListSessionsFormationQueryDto) {
    return this.sessions.lister(query);
  }

  @Get(":id")
  obtenir(@Param("id") id: string) {
    return this.sessions.obtenir(id);
  }

  @Post()
  creer(@Body() dto: CreerSessionFormationDto) {
    return this.sessions.creer(dto);
  }

  @Patch(":id")
  modifier(@Param("id") id: string, @Body() dto: ModifierSessionFormationDto) {
    return this.sessions.modifier(id, dto);
  }

  @Post(":id/annuler")
  annuler(@Param("id") id: string) {
    return this.sessions.annuler(id);
  }

  @Put(":id/presences")
  enregistrerPresences(@Param("id") id: string, @Body() dto: EnregistrerPresencesDto) {
    return this.sessions.enregistrerPresences(id, dto);
  }

  @Post(":id/cloturer")
  cloturer(@Param("id") id: string) {
    return this.sessions.cloturer(id);
  }
}

// §4.3, §4.6 — participants d'une réservation et registre du personnel formé.
@Controller("reservations/:reservationId/participants")
export class ParticipantsFormationController {
  constructor(private readonly participants: ParticipantsFormationService) {}

  @Get()
  lister(@Param("reservationId") reservationId: string, @CurrentUser() user: JwtAccessPayload) {
    return this.participants.lister(reservationId, user);
  }

  @Post()
  ajouter(
    @Param("reservationId") reservationId: string,
    @Body() dto: AjouterParticipantDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.participants.ajouter(reservationId, dto, user);
  }

  @Delete(":participantId")
  @HttpCode(204)
  retirer(
    @Param("reservationId") reservationId: string,
    @Param("participantId") participantId: string,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.participants.retirer(reservationId, participantId, user);
  }

  @Get("registre")
  registre(@Param("reservationId") reservationId: string, @CurrentUser() user: JwtAccessPayload) {
    return this.participants.registre(reservationId, user);
  }

  @Get("registre.csv")
  async registreCsv(
    @Param("reservationId") reservationId: string,
    @CurrentUser() user: JwtAccessPayload,
    @Res() res: Response,
  ) {
    const csv = await this.participants.registreCsv(reservationId, user);
    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registre-formation-${reservationId}.csv"`,
    });
    res.send(csv);
  }

  @Get("registre.pdf")
  async registrePdf(
    @Param("reservationId") reservationId: string,
    @CurrentUser() user: JwtAccessPayload,
    @Res() res: Response,
  ) {
    const pdf = await this.participants.registrePdf(reservationId, user);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="registre-formation-${reservationId}.pdf"`,
    });
    res.send(pdf);
  }
}
