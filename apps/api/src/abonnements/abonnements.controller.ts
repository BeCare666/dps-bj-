import { Controller, Get, Param, ParseEnumPipe, Post } from "@nestjs/common";
import { AbonnementsService } from "./abonnements.service.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { ModuleMetier, RoleUtilisateur } from "../generated/prisma/enums.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";

@Controller("abonnements")
export class AbonnementsController {
  constructor(private readonly abonnementsService: AbonnementsService) {}

  @Get(":module")
  async monStatut(
    @Param("module", new ParseEnumPipe(ModuleMetier)) module: ModuleMetier,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    if (!user.organisationId) return null;
    return this.abonnementsService.obtenirStatut(user.organisationId, module);
  }

  // Activation manuelle, en attendant l'intégration KKiaPay (sections 9/11.3).
  @Roles(RoleUtilisateur.ADMIN_PLATEFORME)
  @Post(":organisationId/:module/activer")
  activer(
    @Param("organisationId") organisationId: string,
    @Param("module", new ParseEnumPipe(ModuleMetier)) module: ModuleMetier,
  ) {
    return this.abonnementsService.activerManuellement(organisationId, module);
  }
}
