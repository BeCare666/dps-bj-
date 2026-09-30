import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ListOrganisationsQueryDto } from "./dto/list-organisations-query.dto.js";
import type { ModifierOrganisationDto } from "./dto/modifier-organisation.dto.js";

@Injectable()
export class OrganisationsService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenir(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({ where: { id: organisationId } });
    if (!organisation) throw new NotFoundException("Organisation introuvable");
    return organisation;
  }

  // D2 — vue plateforme (admin) : tous les établissements, pas de filtrage par
  // organisationId (endpoint explicitement réservé à ADMIN_PLATEFORME).
  async lister(query: ListOrganisationsQueryDto) {
    const actif = query.actif === "true" ? true : query.actif === "false" ? false : undefined;
    return this.prisma.organisation.findMany({
      where: { type: query.type, actif },
      orderBy: { nom: "asc" },
    });
  }

  // Fiche établissement (admin) : infos + compteurs réels (utilisateurs,
  // patients, EI, réservations) — périmètre exact validé dans ROADMAP.md (D2).
  async obtenirDetailAdmin(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      include: {
        _count: {
          select: { utilisateurs: true, patients: true, evenementsIndesirables: true, reservations: true },
        },
      },
    });
    if (!organisation) throw new NotFoundException("Organisation introuvable");
    return organisation;
  }

  async activer(organisationId: string, acteurId: string) {
    const avant = await this.obtenir(organisationId);
    const apres = await this.prisma.organisation.update({ where: { id: organisationId }, data: { actif: true } });
    await this.tracer(acteurId, organisationId, "etablissement.activer", avant.actif, apres.actif);
    return apres;
  }

  async desactiver(organisationId: string, acteurId: string) {
    const avant = await this.obtenir(organisationId);
    const apres = await this.prisma.organisation.update({ where: { id: organisationId }, data: { actif: false } });
    await this.tracer(acteurId, organisationId, "etablissement.desactiver", avant.actif, apres.actif);
    return apres;
  }

  // D8.1 — auto-édition des coordonnées par le RESPONSABLE_COMPTE de
  // l'organisation elle-même (jamais un organisationId arbitraire : le
  // contrôleur ne passe ici que `user.organisationId` issu du token, voir
  // OrganisationsController.modifierMesInfos).
  async modifierMesInfos(organisationId: string, dto: ModifierOrganisationDto, acteurId: string) {
    const avant = await this.obtenir(organisationId);

    if (dto.email && dto.email !== avant.email) {
      const emailPris = await this.prisma.organisation.findUnique({ where: { email: dto.email } });
      if (emailPris) throw new ConflictException("Cet email est déjà utilisé par une autre organisation");
    }

    const apres = await this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        nom: dto.nom,
        adresse: dto.adresse,
        telephone: dto.telephone,
        email: dto.email,
      },
    });

    await this.prisma.journalAudit.create({
      data: {
        organisationId,
        utilisateurId: acteurId,
        action: "etablissement.modifier_coordonnees",
        entite: "Organisation",
        entiteId: organisationId,
        donneesAvant: { nom: avant.nom, adresse: avant.adresse, telephone: avant.telephone, email: avant.email },
        donneesApres: { nom: apres.nom, adresse: apres.adresse, telephone: apres.telephone, email: apres.email },
      },
    });

    return apres;
  }

  // D7 — audit : qui (acteurId, l'admin), quoi (action), sur quelle
  // organisation (organisationId sert ici de cible, pas de portée de l'acteur).
  private async tracer(
    acteurId: string,
    organisationId: string,
    action: string,
    actifAvant: boolean,
    actifApres: boolean,
  ): Promise<void> {
    await this.prisma.journalAudit.create({
      data: {
        organisationId,
        utilisateurId: acteurId,
        action,
        entite: "Organisation",
        entiteId: organisationId,
        donneesAvant: { actif: actifAvant },
        donneesApres: { actif: actifApres },
      },
    });
  }
}
