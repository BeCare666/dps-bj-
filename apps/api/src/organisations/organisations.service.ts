import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class OrganisationsService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenir(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({ where: { id: organisationId } });
    if (!organisation) throw new NotFoundException("Organisation introuvable");
    return organisation;
  }
}
