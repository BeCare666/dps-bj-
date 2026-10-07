import type { Periodicite } from "./types.js";

// Les 12 départements du Bénin.
export const DEPARTEMENTS = {
  ALIBORI: "Alibori",
  ATACORA: "Atacora",
  ATLANTIQUE: "Atlantique",
  BORGOU: "Borgou",
  COLLINES: "Collines",
  COUFFO: "Couffo",
  DONGA: "Donga",
  LITTORAL: "Littoral",
  MONO: "Mono",
  OUEME: "Ouémé",
  PLATEAU: "Plateau",
  ZOU: "Zou",
} as const;

export type CodeDepartement = keyof typeof DEPARTEMENTS;

export function estCodeDepartement(v: unknown): v is CodeDepartement {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(DEPARTEMENTS, v);
}

// Clé de rapprochement d'un nom saisi librement (zone sanitaire) : sans
// accents, sans casse, espaces et ponctuation réduits.
export function cleRapprochement(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const RE_MOIS = /^(\d{4})-(0[1-9]|1[0-2])$/;
const RE_SEMAINE = /^(\d{4})-S(0[1-9]|[1-4]\d|5[0-3])$/;

// Lundi de la semaine ISO 1 : la semaine qui contient le 4 janvier.
function lundiSemaine1(annee: number): Date {
  const quatreJanvier = new Date(Date.UTC(annee, 0, 4));
  const jour = quatreJanvier.getUTCDay() || 7;
  return new Date(Date.UTC(annee, 0, 4 - (jour - 1)));
}

function nombreSemainesIso(annee: number): number {
  const debut = lundiSemaine1(annee).getTime();
  const debutSuivante = lundiSemaine1(annee + 1).getTime();
  return Math.round((debutSuivante - debut) / (7 * 86_400_000));
}

export interface BornesPeriode {
  debut: Date;
  // Dernier jour inclus.
  fin: Date;
}

// Période d'un rapport : « AAAA-MM » (mensuel) ou « AAAA-Snn » (semaine ISO,
// du lundi au dimanche — conforme au formulaire 12_BJ : « semaine 11 du
// 09/03/26 au 15/03/26 »).
export function bornesPeriode(periodicite: Periodicite, periode: string): BornesPeriode | null {
  if (periodicite === "MENSUELLE") {
    const m = RE_MOIS.exec(periode);
    if (!m) return null;
    const annee = Number(m[1]);
    const mois = Number(m[2]) - 1;
    return { debut: new Date(Date.UTC(annee, mois, 1)), fin: new Date(Date.UTC(annee, mois + 1, 0)) };
  }
  const m = RE_SEMAINE.exec(periode);
  if (!m) return null;
  const annee = Number(m[1]);
  const semaine = Number(m[2]);
  if (semaine > nombreSemainesIso(annee)) return null;
  const debut = new Date(lundiSemaine1(annee).getTime() + (semaine - 1) * 7 * 86_400_000);
  return { debut, fin: new Date(debut.getTime() + 6 * 86_400_000) };
}

export function periodeValide(periodicite: Periodicite, periode: string): boolean {
  return bornesPeriode(periodicite, periode) !== null;
}

function jjmmaaaa(d: Date): string {
  const jj = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${jj}/${mm}/${d.getUTCFullYear()}`;
}

export function libellePeriode(periodicite: Periodicite, periode: string): string {
  const bornes = bornesPeriode(periodicite, periode);
  if (!bornes) return periode;
  if (periodicite === "MENSUELLE") {
    return `${MOIS[bornes.debut.getUTCMonth()]} ${bornes.debut.getUTCFullYear()}`;
  }
  const semaine = Number(periode.slice(6));
  return `semaine ${semaine} du ${jjmmaaaa(bornes.debut)} au ${jjmmaaaa(bornes.fin)}`;
}

// Période qui contient la date donnée.
export function periodeDeDate(periodicite: Periodicite, date: Date): string {
  if (periodicite === "MENSUELLE") {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  const jour = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  let annee = date.getUTCFullYear() + 1;
  while (lundiSemaine1(annee).getTime() > jour) annee -= 1;
  const semaine = Math.floor((jour - lundiSemaine1(annee).getTime()) / (7 * 86_400_000)) + 1;
  return `${annee}-S${String(semaine).padStart(2, "0")}`;
}
