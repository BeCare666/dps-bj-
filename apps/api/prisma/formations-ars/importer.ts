// Catalogue officiel des formations EH et ESPC (ROADMAP_FORMATIONS_VERIFICATION.md
// §1). Contenu converti des documents Word fournis par le client (dossier
// formations/) par convertir_docx.py, sans réécriture du texte.
//
// Import idempotent : une formation est identifiée par type d'établissement +
// critère + titre. Les formations absentes sont créées ; une formation déjà en
// base n'est jamais modifiée (elle a pu être complétée dans l'admin : tarifs,
// image, texte). Les documents ne donnant aucun tarif, les formations créées
// prennent les prix par personne par défaut (5 000 / 3 000 / 2 000 FCFA).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NiveauCritere, PrismaClient, TypeEtablissement } from "../../src/generated/prisma/client.js";

export interface FormationArs {
  critere: string;
  niveau: NiveauCritere;
  domaineCode: string;
  domaine: string;
  titre: string;
  public: string;
  // EH : « Objectif : » du programme ; ESPC : « Exigence A.R.S : ».
  objectif?: string;
  exigenceArs?: string;
  contenus: string;
  methode: string;
  evaluation: string;
  dureeLibelle: string;
  dureeHeures: number | null;
  ordre: number;
}

const dossier = dirname(fileURLToPath(import.meta.url));
export const FICHIERS_FORMATIONS_ARS: { fichier: string; type: TypeEtablissement }[] = [
  { fichier: "eh.json", type: "EH" },
  { fichier: "espc.json", type: "ESPC" },
];

export function lireFormationsArs(fichier: string): FormationArs[] {
  return JSON.parse(readFileSync(join(dossier, fichier), "utf8")) as FormationArs[];
}

export async function importerFormationsArs(prisma: PrismaClient) {
  for (const { fichier, type } of FICHIERS_FORMATIONS_ARS) {
    const formations = lireFormationsArs(fichier);
    const existantes = await prisma.formation.findMany({
      where: { typeEtablissement: type },
      select: { critere: true, titre: true },
    });
    const cles = new Set(existantes.map((f) => `${f.critere}|${f.titre}`));
    const aCreer = formations.filter((f) => !cles.has(`${f.critere}|${f.titre}`));
    if (aCreer.length > 0) {
      await prisma.formation.createMany({
        data: aCreer.map((f) => ({
          typeEtablissement: type,
          critere: f.critere,
          niveau: f.niveau,
          domaineCode: f.domaineCode,
          domaine: f.domaine,
          titre: f.titre,
          // Champ obligatoire du catalogue existant : le premier intitulé du programme.
          description: f.objectif ?? f.exigenceArs ?? "",
          objectifs: f.objectif ?? null,
          exigenceArs: f.exigenceArs ?? null,
          publicCible: f.public,
          contenus: f.contenus,
          methode: f.methode,
          evaluation: f.evaluation,
          dureeLibelle: f.dureeLibelle,
          dureeHeures: f.dureeHeures,
          ordre: f.ordre,
          actif: true,
        })),
      });
    }
    console.log(`Formations ${type} : ${aCreer.length} créée(s), ${formations.length - aCreer.length} déjà présente(s).`);
  }
}
