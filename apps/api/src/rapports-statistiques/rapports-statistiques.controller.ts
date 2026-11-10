import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RapportsStatistiquesService } from "./rapports-statistiques.service.js";
import { CreerRapportDto, EnregistrerRapportDto, ListerRapportsQueryDto } from "./dto/rapports-statistiques.dto.js";
import { AutoriteStatistiquesService } from "./autorite-statistiques.service.js";
import { DonneesQueryDto, FiltresAutoriteDto, TransmissionsQueryDto } from "./dto/autorite-statistiques.dto.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { RoleUtilisateur } from "../generated/prisma/enums.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";

// Décision client : seul le responsable du compte remplit et soumet les
// rapports statistiques de son établissement. Module gratuit (pas de
// @ModuleAbonne).
@Roles(RoleUtilisateur.RESPONSABLE_COMPTE)
@Controller("rapports-statistiques")
export class RapportsStatistiquesController {
  constructor(private readonly service: RapportsStatistiquesService) {}

  @Get()
  lister(@Query() query: ListerRapportsQueryDto, @CurrentUser() user: JwtAccessPayload) {
    return this.service.lister(query, user);
  }

  @Post()
  creer(@Body() dto: CreerRapportDto, @CurrentUser() user: JwtAccessPayload) {
    return this.service.creer(dto, user);
  }

  @Get(":id")
  obtenir(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.service.obtenir(id, user);
  }

  @Patch(":id")
  enregistrer(@Param("id") id: string, @Body() dto: EnregistrerRapportDto, @CurrentUser() user: JwtAccessPayload) {
    return this.service.enregistrer(id, dto, user);
  }

  @Post(":id/soumettre")
  soumettre(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.service.soumettre(id, user);
  }
}

// Espace des autorités sanitaires destinataires (zone sanitaire, direction
// départementale, ministère).
@Roles(RoleUtilisateur.AUTORITE_SANITAIRE)
@Controller("autorite")
export class AutoriteRapportsController {
  constructor(
    private readonly service: RapportsStatistiquesService,
    private readonly statistiques: AutoriteStatistiquesService,
  ) {}

  @Get("me")
  monAutorite(@CurrentUser() user: JwtAccessPayload) {
    return this.service.monAutorite(user);
  }

  // Tableaux de bord (ROADMAP_ESPACE_AUTORITES.md, étape 3).
  @Get("etablissements")
  etablissements(@CurrentUser() user: JwtAccessPayload) {
    return this.statistiques.etablissements(user);
  }

  @Get("synthese")
  synthese(@Query() query: FiltresAutoriteDto, @CurrentUser() user: JwtAccessPayload) {
    return this.statistiques.synthese(query, user);
  }

  @Get("transmissions")
  transmissions(@Query() query: TransmissionsQueryDto, @CurrentUser() user: JwtAccessPayload) {
    return this.statistiques.transmissions(query, user);
  }

  @Get("donnees")
  donnees(@Query() query: DonneesQueryDto, @CurrentUser() user: JwtAccessPayload) {
    return this.statistiques.donnees(query, user);
  }

  @Get("rapports")
  lister(@Query() query: ListerRapportsQueryDto, @CurrentUser() user: JwtAccessPayload) {
    return this.service.listerPourAutorite(query, user);
  }

  @Get("rapports/:id")
  obtenir(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.service.obtenirPourAutorite(id, user);
  }

  @Post("rapports/:id/valider")
  valider(@Param("id") id: string, @CurrentUser() user: JwtAccessPayload) {
    return this.service.valider(id, user);
  }
}
