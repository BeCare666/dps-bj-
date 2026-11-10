import { bornesPeriode } from "@dps/shared";
import type { DonneesAutorite } from "./types";

// Agrégations des tableaux de bord des autorités (ROADMAP_ESPACE_AUTORITES.md).
// Uniquement des sommes de cases du formulaire et des rapports simples entre
// deux sommes : aucune donnée inventée.

type Rapports = DonneesAutorite["rapports"];

function nombre(v: number | boolean | null | undefined): number {
  return typeof v === "number" ? v : 0;
}

export function somme(rapports: Rapports, cle: string): number {
  return arrondir(rapports.reduce((t, r) => t + nombre(r.valeurs[cle]), 0));
}

export function sommeDe(rapports: Rapports, cles: string[]): number {
  return arrondir(cles.reduce((t, c) => t + somme(rapports, c), 0));
}

// Nombre de rapports ayant répondu « Oui » / renseigné l'élément.
export function compteOui(rapports: Rapports, cle: string): { oui: number; renseignes: number } {
  let oui = 0;
  let renseignes = 0;
  for (const r of rapports) {
    const v = r.valeurs[cle];
    if (typeof v === "boolean") {
      renseignes += 1;
      if (v) oui += 1;
    }
  }
  return { oui, renseignes };
}

export function arrondir(v: number, decimales = 2): number {
  const p = 10 ** decimales;
  return Math.round(v * p) / p;
}

// Pourcentage a / b arrondi au dixième ; null si b = 0.
export function pourcentage(a: number, b: number): number | null {
  return b === 0 ? null : Math.round((a / b) * 1000) / 10;
}

export function formaterNombre(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v);
}

export function formaterPourcentage(v: number | null): string {
  return v === null ? "—" : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v)} %`;
}

// Série chronologique : une ligne par période, une colonne par série.
export function serieParPeriode(
  rapports: Rapports,
  series: { cle: string; cles: string[] }[],
  periodes?: string[],
): Record<string, string | number>[] {
  const liste = periodes ?? [...new Set(rapports.map((r) => r.periode))].sort();
  return liste.map((periode) => {
    const siens = rapports.filter((r) => r.periode === periode);
    const point: Record<string, string | number> = { periode, libelle: libellePeriodeCourt(periode) };
    for (const s of series) point[s.cle] = sommeDe(siens, s.cles);
    return point;
  });
}

// Une ligne par établissement.
export function parEtablissement(
  rapports: Rapports,
  series: { cle: string; cles: string[] }[],
): { id: string; nom: string; commune: string | null; rapports: number; valeurs: Record<string, number> }[] {
  const ids = [...new Set(rapports.map((r) => r.organisationId))];
  return ids
    .map((id) => {
      const siens = rapports.filter((r) => r.organisationId === id);
      return {
        id,
        nom: siens[0].organisationNom,
        commune: siens[0].commune,
        rapports: siens.length,
        valeurs: Object.fromEntries(series.map((s) => [s.cle, sommeDe(siens, s.cles)])),
      };
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// « janv. 26 » pour un mois, « S27 · 26 » pour une semaine ISO.
export function libellePeriodeCourt(periode: string): string {
  const mois = /^(\d{4})-(\d{2})$/.exec(periode);
  if (mois) return `${MOIS_COURTS[Number(mois[2]) - 1]} ${mois[1].slice(2)}`;
  const semaine = /^(\d{4})-S(\d{2})$/.exec(periode);
  if (semaine) return `S${Number(semaine[2])} · ${semaine[1].slice(2)}`;
  return periode;
}

// Date de début d'une période (tri, info-bulles).
export function debutPeriode(periode: string): Date | null {
  const b = bornesPeriode(periode.includes("-S") ? "HEBDOMADAIRE" : "MENSUELLE", periode);
  return b?.debut ?? null;
}
