import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

// D8 — un paramètre ne peut être modifié que s'il est déjà connu (créé au
// seed, voir prisma/seed.ts) : on n'autorise jamais la création d'une clé
// arbitraire depuis l'API — conforme à "ne pas inventer une liste de
// réglages génériques", seuls les paramètres validés existent.
const VALIDATEURS: Record<string, (valeur: string) => void> = {
  duree_essai_module_jours: (valeur) => {
    const n = Number(valeur);
    if (!Number.isInteger(n) || n < 1 || n > 3650) {
      throw new BadRequestException("duree_essai_module_jours doit être un entier entre 1 et 3650 (jours)");
    }
  },
};

@Injectable()
export class ParametresService {
  constructor(private readonly prisma: PrismaService) {}

  async listerTous() {
    return this.prisma.parametrePlateforme.findMany({ orderBy: { cle: "asc" } });
  }

  // Utilisé par les autres services métier (ex. AbonnementsService) — repli
  // sur `defaut` si la ligne n'existe pas encore (ne doit normalement pas
  // arriver une fois le seed exécuté, mais évite un crash si absent).
  async obtenirValeurEntiere(cle: string, defaut: number): Promise<number> {
    const parametre = await this.prisma.parametrePlateforme.findUnique({ where: { cle } });
    if (!parametre) return defaut;
    const n = Number(parametre.valeur);
    return Number.isFinite(n) ? n : defaut;
  }

  async modifier(cle: string, valeur: string, acteurId: string) {
    const existant = await this.prisma.parametrePlateforme.findUnique({ where: { cle } });
    if (!existant) {
      throw new NotFoundException(`Paramètre inconnu : ${cle}`);
    }

    const validateur = VALIDATEURS[cle];
    if (validateur) validateur(valeur);

    const misAJour = await this.prisma.parametrePlateforme.update({ where: { cle }, data: { valeur } });

    await this.prisma.journalAudit.create({
      data: {
        organisationId: null,
        utilisateurId: acteurId,
        action: "parametre.modifier",
        entite: "ParametrePlateforme",
        entiteId: cle,
        donneesAvant: { valeur: existant.valeur },
        donneesApres: { valeur: misAJour.valeur },
      },
    });

    return misAJour;
  }
}
