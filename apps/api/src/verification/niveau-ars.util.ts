// Échelle de sécurité des patients (manuels ARS EH p. 55 et ESPC p. 48, tableau 8) :
// - niveau 0 : critères essentiels < 100 % ;
// - niveau 1 : essentiels 100 % ;
// - niveau 2 : + fondamentaux de 60 à 89 % ;
// - niveau 3 : + fondamentaux ≥ 90 % ;
// - niveau 4 : + avancés ≥ 80 % ;
// - niveau 5 : essentiels, fondamentaux et avancés à 100 %.
// Une catégorie non évaluée (aucune auto-évaluation soumise) ne permet pas
// d'atteindre le niveau qui la requiert.
export type CategorieCritere = "ESSENTIEL" | "FONDAMENTAL" | "AVANCE";

export interface PourcentagesArs {
  essentiels: number | null;
  fondamentaux: number | null;
  avances: number | null;
}

export const SEUIL_FONDAMENTAUX_NIVEAU_2 = 60;
export const SEUIL_FONDAMENTAUX_NIVEAU_3 = 90;
export const SEUIL_AVANCES_NIVEAU_4 = 80;

// null : aucun résultat pour les critères essentiels, niveau non calculable.
export function calculerNiveauArs(p: PourcentagesArs): number | null {
  if (p.essentiels === null) return null;
  if (p.essentiels < 100) return 0;
  const f = p.fondamentaux;
  if (f === null || f < SEUIL_FONDAMENTAUX_NIVEAU_2) return 1;
  if (f < SEUIL_FONDAMENTAUX_NIVEAU_3) return 2;
  const a = p.avances;
  if (a === null || a < SEUIL_AVANCES_NIVEAU_4) return 3;
  if (f === 100 && a === 100) return 5;
  return 4;
}

// Catégorie d'une grille officielle, lue dans son nom (« Grille d'auto-évaluation
// des critères essentiels | fondamentaux | avancés des EH / ESPC »).
export function categorieDeGrille(nom: string): CategorieCritere | null {
  const n = nom.toLowerCase();
  if (n.includes("critères essentiels")) return "ESSENTIEL";
  if (n.includes("critères fondamentaux")) return "FONDAMENTAL";
  if (n.includes("critères avancés")) return "AVANCE";
  return null;
}
