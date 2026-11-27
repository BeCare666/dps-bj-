import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { StatutSessionFormation, type TypeEtablissement } from "../generated/prisma/enums.js";
import type { CreateFormationDto } from "./dto/create-formation.dto.js";

// Sessions à venir présentées au catalogue : jamais le lien ni le code Meet,
// réservés aux participants inscrits (§4.4).
const sessionsAVenir = () => ({
  where: { statut: StatutSessionFormation.PLANIFIEE, debut: { gt: new Date() } },
  orderBy: { debut: "asc" as const },
  select: { id: true, debut: true, fin: true, placesMax: true },
});

@Injectable()
export class FormationsService {
  private readonly logger = new Logger(FormationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // 10.1 — catalogue public : uniquement les formations actives pour les non-admins.
  // Catalogue officiel trié par type d'établissement puis dans l'ordre des documents.
  async lister(inclureInactives: boolean, type?: TypeEtablissement) {
    return this.prisma.formation.findMany({
      where: { ...(inclureInactives ? {} : { actif: true }), ...(type ? { typeEtablissement: type } : {}) },
      orderBy: [{ typeEtablissement: "asc" }, { ordre: "asc" }, { titre: "asc" }],
      include: { sessions: sessionsAVenir() },
    });
  }

  async obtenir(id: string) {
    const formation = await this.prisma.formation.findUnique({ where: { id }, include: { sessions: sessionsAVenir() } });
    if (!formation) throw new NotFoundException("Formation introuvable");
    return formation;
  }

  async creer(dto: CreateFormationDto) {
    return this.prisma.formation.create({ data: dto });
  }

  async mettreAJour(id: string, dto: CreateFormationDto) {
    await this.obtenir(id);
    return this.prisma.formation.update({ where: { id }, data: dto });
  }

  // §3.2 — image de couverture ; l'ancienne est supprimée de Cloudinary.
  async definirImage(id: string, fichier: { buffer: Buffer; mimetype: string; originalname: string }) {
    const formation = await this.obtenir(id);
    const { url, cloudinaryId } = await this.cloudinary.uploadBuffer(
      fichier.buffer,
      fichier.mimetype,
      fichier.originalname,
      "dps-bj/formations",
    );
    const misAJour = await this.prisma.formation.update({
      where: { id },
      data: { imageUrl: url, imageCloudinaryId: cloudinaryId },
    });
    if (formation.imageCloudinaryId) await this.supprimerFichier(formation.imageCloudinaryId);
    return misAJour;
  }

  async retirerImage(id: string) {
    const formation = await this.obtenir(id);
    const misAJour = await this.prisma.formation.update({
      where: { id },
      data: { imageUrl: null, imageCloudinaryId: null },
    });
    if (formation.imageCloudinaryId) await this.supprimerFichier(formation.imageCloudinaryId);
    return misAJour;
  }

  async desactiver(id: string) {
    await this.obtenir(id);
    return this.prisma.formation.update({ where: { id }, data: { actif: false } });
  }

  async reactiver(id: string) {
    await this.obtenir(id);
    return this.prisma.formation.update({ where: { id }, data: { actif: true } });
  }

  // Un échec de suppression Cloudinary laisse un fichier orphelin, sans
  // empêcher la mise à jour de la formation.
  private async supprimerFichier(cloudinaryId: string) {
    try {
      await this.cloudinary.supprimer(cloudinaryId);
    } catch (e) {
      this.logger.warn(`Suppression Cloudinary impossible (${cloudinaryId}) : ${(e as Error).message}`);
    }
  }
}
