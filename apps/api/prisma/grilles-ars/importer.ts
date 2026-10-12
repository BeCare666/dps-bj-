// Grilles officielles ARS Bénin — critères essentiels EH et ESPC (CDC §6.1).
// Contenu extrait des PDF fournis par le client (dossier GRILLES/), libellés
// manquants ou corrompus complétés d'après les manuels ARS : voir
// GRILLES/RAPPORT_INTEGRATION_GRILLES.md pour la liste exhaustive des corrections.
//
// Import idempotent : une grille déjà présente sous ce nom n'est jamais modifiée
// (versionnage figé, RM3). À la première publication, la grille « placeholder »
// du même type est archivée : les sessions existantes restent consultables.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StatutGrille, type PrismaClient, type TypeElementMesurable, type TypeEtablissement, type TypeReponse } from "../../src/generated/prisma/client.js";

interface ElementArs {
  libelle: string;
  typeElement: TypeElementMesurable;
  typeReponse: TypeReponse;
  entreDansScore: boolean;
  ordre: number;
}

interface CritereArs {
  code: string;
  libelle: string;
  categorie: string;
  registre: string | null;
  ordre: number;
  elementsMesurables: ElementArs[];
}

interface NormeArs {
  code: string;
  libelle: string;
  ordre: number;
  criteres: CritereArs[];
}

export interface GrilleArs {
  nom: string;
  type: TypeEtablissement;
  domaines: { nom: string; ordre: number; normes: NormeArs[] }[];
}

const dossier = dirname(fileURLToPath(import.meta.url));
export const FICHIERS_GRILLES_ARS = ["eh.json", "espc.json"] as const;

export function lireGrilleArs(fichier: (typeof FICHIERS_GRILLES_ARS)[number]): GrilleArs {
  return JSON.parse(readFileSync(join(dossier, fichier), "utf8")) as GrilleArs;
}

export async function importerGrillesArs(prisma: PrismaClient) {
  for (const fichier of FICHIERS_GRILLES_ARS) {
    const grille = lireGrilleArs(fichier);
    const existante = await prisma.grille.findFirst({ where: { nom: grille.nom } });
    if (existante) {
      console.log(`${grille.nom} déjà présente (v${existante.version}), aucune modification.`);
      continue;
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.grille.create({
          data: {
            nom: grille.nom,
            type: grille.type,
            version: 1,
            statut: StatutGrille.PUBLIEE,
            publieeLe: new Date(),
            domaines: {
              create: grille.domaines.map((domaine) => ({
                nom: domaine.nom,
                ordre: domaine.ordre,
                normes: {
                  create: domaine.normes.map((norme) => ({
                    code: norme.code,
                    libelle: norme.libelle,
                    ordre: norme.ordre,
                    criteres: {
                      create: norme.criteres.map((critere) => ({
                        code: critere.code,
                        libelle: critere.libelle,
                        categorie: critere.categorie,
                        registre: critere.registre,
                        ordre: critere.ordre,
                        elementsMesurables: { create: critere.elementsMesurables },
                      })),
                    },
                  })),
                },
              })),
            },
          },
        });
        const archivees = await tx.grille.updateMany({
          where: { nom: `Grille ${grille.type} — placeholder`, statut: StatutGrille.PUBLIEE },
          data: { statut: StatutGrille.ARCHIVEE },
        });
        if (archivees.count > 0) console.log(`Grille ${grille.type} — placeholder archivée.`);
      },
      { timeout: 120_000 },
    );
    console.log(`${grille.nom} v1 créée et publiée.`);
  }
}
