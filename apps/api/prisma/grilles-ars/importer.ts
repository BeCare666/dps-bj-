// Grilles officielles ARS Bénin — critères essentiels, fondamentaux et avancés,
// EH et ESPC (CDC §6.1). Contenu converti des fichiers Excel fournis par le
// client (dossier mise_a_jour/) par convertir_xlsx.py, qui liste les seules
// corrections appliquées.
//
// Import idempotent et versionné (RM3) : une grille publiée n'est jamais
// modifiée. Si le contenu du JSON diffère de la dernière version publiée sous
// ce nom, une nouvelle version est créée et publiée, et la précédente est
// archivée : ses sessions restent consultables. À la première publication, la
// grille « placeholder » du même type est archivée.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StatutGrille, type PrismaClient, type TypeElementMesurable, type TypeEtablissement, type TypeReponse } from "../../src/generated/prisma/client.js";

const structureInclude = {
  domaines: {
    orderBy: { ordre: "asc" },
    include: {
      normes: {
        orderBy: { ordre: "asc" },
        include: { criteres: { orderBy: { ordre: "asc" }, include: { elementsMesurables: { orderBy: { ordre: "asc" } } } } },
      },
    },
  },
} as const;

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
export const FICHIERS_GRILLES_ARS = [
  "eh.json",
  "eh-fondamental.json",
  "eh-avance.json",
  "espc.json",
  "espc-fondamental.json",
  "espc-avance.json",
] as const;

export function lireGrilleArs(fichier: (typeof FICHIERS_GRILLES_ARS)[number]): GrilleArs {
  return JSON.parse(readFileSync(join(dossier, fichier), "utf8")) as GrilleArs;
}

// Forme canonique, commune au JSON et à la base, pour comparer deux contenus.
function empreinte(grille: GrilleArs): string {
  return JSON.stringify({
    type: grille.type,
    domaines: grille.domaines.map((d) => ({
      nom: d.nom,
      ordre: d.ordre,
      normes: d.normes.map((n) => ({
        code: n.code,
        libelle: n.libelle,
        ordre: n.ordre,
        criteres: n.criteres.map((c) => ({
          code: c.code,
          libelle: c.libelle,
          categorie: c.categorie ?? null,
          registre: c.registre ?? null,
          ordre: c.ordre,
          elements: c.elementsMesurables.map((e) => [e.libelle, e.typeElement, e.typeReponse, e.entreDansScore, e.ordre]),
        })),
      })),
    })),
  });
}

export async function importerGrillesArs(prisma: PrismaClient) {
  for (const fichier of FICHIERS_GRILLES_ARS) {
    const grille = lireGrilleArs(fichier);
    const derniere = await prisma.grille.findFirst({ where: { nom: grille.nom }, orderBy: { version: "desc" } });
    const publiee = await prisma.grille.findFirst({
      where: { nom: grille.nom, statut: StatutGrille.PUBLIEE },
      orderBy: { version: "desc" },
      include: structureInclude,
    });
    if (publiee && empreinte(publiee as unknown as GrilleArs) === empreinte(grille)) {
      console.log(`${grille.nom} v${publiee.version} déjà à jour, aucune modification.`);
      continue;
    }
    const version = (derniere?.version ?? 0) + 1;

    await prisma.$transaction(
      async (tx) => {
        // Les versions précédentes publiées sont archivées avant la création :
        // une seule version de chaque grille est proposée aux établissements.
        const anciennes = await tx.grille.updateMany({
          where: { nom: grille.nom, statut: StatutGrille.PUBLIEE },
          data: { statut: StatutGrille.ARCHIVEE },
        });
        if (anciennes.count > 0) console.log(`${grille.nom} : ${anciennes.count} version(s) précédente(s) archivée(s).`);
        await tx.grille.create({
          data: {
            nom: grille.nom,
            type: grille.type,
            version,
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
      { timeout: 300_000 },
    );
    console.log(`${grille.nom} v${version} créée et publiée.`);
  }
}
