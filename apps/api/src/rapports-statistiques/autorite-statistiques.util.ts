import { cleRapprochement } from "@dps/shared";

// Fonctions pures des tableaux de bord des autorités (ROADMAP_ESPACE_AUTORITES.md).

export const JOUR_MS = 86_400_000;

export interface StatistiqueDelai {
  // Nombre de mesures.
  n: number;
  // En jours, arrondis au dixième ; null sans mesure.
  moyenne: number | null;
  mediane: number | null;
}

export function statistiqueDelai(joursListe: number[]): StatistiqueDelai {
  const valeurs = joursListe.filter((j) => Number.isFinite(j)).sort((a, b) => a - b);
  if (valeurs.length === 0) return { n: 0, moyenne: null, mediane: null };
  const milieu = Math.floor(valeurs.length / 2);
  const mediane = valeurs.length % 2 ? valeurs[milieu] : (valeurs[milieu - 1] + valeurs[milieu]) / 2;
  const moyenne = valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
  return { n: valeurs.length, moyenne: Math.round(moyenne * 10) / 10, mediane: Math.round(mediane * 10) / 10 };
}

export function joursEntre(debut: Date, fin: Date): number {
  return (fin.getTime() - debut.getTime()) / JOUR_MS;
}

export interface RessortAutorite {
  niveau: "ZONE_SANITAIRE" | "DEPARTEMENT" | "NATIONAL";
  departement: string | null;
  zoneSanitaireCle: string | null;
}

// Établissement localisé (fiche « Mon établissement ») dans le ressort de
// l'autorité : même règle que pour les rapports (département, puis zone
// sanitaire rapprochée sans casse ni accents).
export function etablissementDansRessort(
  autorite: RessortAutorite,
  org: { departement: string | null; zoneSanitaire: string | null },
): boolean {
  if (autorite.niveau === "NATIONAL") return true;
  if (!autorite.departement || org.departement !== autorite.departement) return false;
  if (autorite.niveau === "DEPARTEMENT") return true;
  return Boolean(autorite.zoneSanitaireCle && org.zoneSanitaire && cleRapprochement(org.zoneSanitaire) === autorite.zoneSanitaireCle);
}

export function liste(valeur: string | undefined): string[] {
  return (valeur ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function dateUtc(valeur: string | undefined): Date | null {
  if (!valeur) return null;
  const d = new Date(`${valeur}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Mois AAAA-MM d'une date (UTC).
export function moisDe(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
