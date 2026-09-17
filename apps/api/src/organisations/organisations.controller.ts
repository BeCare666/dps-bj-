import { Controller, ForbiddenException, Get } from "@nestjs/common";
import { OrganisationsService } from "./organisations.service.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";

@Controller("organisations")
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Get("me")
  moi(@CurrentUser() user: JwtAccessPayload) {
    if (!user.organisationId) {
      throw new ForbiddenException("Réservé aux comptes organisation");
    }
    return this.organisationsService.obtenir(user.organisationId);
  }
}
