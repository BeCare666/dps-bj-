import { Controller, Get } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { Permissions } from "../auth/decorators/permissions.decorator.js";
import { RoleUtilisateur } from "../generated/prisma/enums.js";

@Roles(RoleUtilisateur.ADMIN_PLATEFORME)
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Permissions("ANALYTICS_READ")
  @Get()
  obtenirAnalytics() {
    return this.analyticsService.obtenirAnalytics();
  }
}
