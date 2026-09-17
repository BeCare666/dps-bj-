import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { ModuleMetier, StatutAbonnement } from "../generated/prisma/enums.js";
import type { AbonnementModule } from "../generated/prisma/client.js";

// RM6 — essai gratuit paramétrable, 90 jours par défaut, bascule auto en payant.
const DUREE_ESSAI_JOURS = Number(process.env.DUREE_ESSAI_MODULE_JOURS ?? 90);

@Injectable()
export class AbonnementsService {
  constructor(private readonly prisma: PrismaService) {}

  // Provisionne l'essai à la première utilisation du module par l'organisation,
  // puis autorise/refuse l'accès selon le statut courant.
  async verifierAcces(organisationId: string, module: ModuleMetier): Promise<AbonnementModule> {
    let abonnement = await this.prisma.abonnementModule.findUnique({
      where: { organisationId_module: { organisationId, module } },
    });

    if (!abonnement) {
      const maintenant = new Date();
      abonnement = await this.prisma.abonnementModule.create({
        data: {
          organisationId,
          module,
          statut: StatutAbonnement.ESSAI,
          essaiDebut: maintenant,
          essaiFin: new Date(maintenant.getTime() + DUREE_ESSAI_JOURS * 86_400_000),
        },
      });
    }

    if (abonnement.statut === StatutAbonnement.ESSAI && abonnement.essaiFin < new Date()) {
      abonnement = await this.prisma.abonnementModule.update({
        where: { id: abonnement.id },
        data: { statut: StatutAbonnement.EXPIRE },
      });
    }

    if (abonnement.statut === StatutAbonnement.EXPIRE) {
      throw new ForbiddenException(
        `Accès au module ${module} expiré — un abonnement est nécessaire pour continuer`,
      );
    }

    return abonnement;
  }

  async obtenirStatut(organisationId: string, module: ModuleMetier) {
    return this.prisma.abonnementModule.findUnique({
      where: { organisationId_module: { organisationId, module } },
    });
  }

  // Activation manuelle par l'admin plateforme, en attendant l'intégration
  // KKiaPay (sections 9/11.3) qui automatisera le passage ESSAI -> ACTIF.
  async activerManuellement(organisationId: string, module: ModuleMetier) {
    return this.prisma.abonnementModule.upsert({
      where: { organisationId_module: { organisationId, module } },
      update: { statut: StatutAbonnement.ACTIF, activeLe: new Date() },
      create: {
        organisationId,
        module,
        statut: StatutAbonnement.ACTIF,
        essaiDebut: new Date(),
        essaiFin: new Date(),
        activeLe: new Date(),
      },
    });
  }

  // 7.14 — scheduler quotidien : bascule ESSAI -> EXPIRE pour les essais échus
  // qui n'ont pas été sollicités entre-temps par `verifierAcces`.
  async expirerEssaisEchus(): Promise<number> {
    const resultat = await this.prisma.abonnementModule.updateMany({
      where: { statut: StatutAbonnement.ESSAI, essaiFin: { lt: new Date() } },
      data: { statut: StatutAbonnement.EXPIRE },
    });
    return resultat.count;
  }
}
