// Filtres communs de l'espace des autorités (ROADMAP_ESPACE_AUTORITES.md,
// étape 4.2). L'état vit dans l'URL : chaque vue est partageable et conservée
// au retour arrière. Module sans dépendance serveur : lu par les pages
// (serveur) et par la barre de filtres (client).

export type RaccourciPeriode = "3m" | "6m" | "12m" | "annee" | "tout" | "perso";

export const RACCOURCIS_PERIODE: { valeur: RaccourciPeriode; libelle: string }[] = [
  { valeur: "3m", libelle: "3 derniers mois" },
  { valeur: "6m", libelle: "6 derniers mois" },
  { valeur: "12m", libelle: "12 derniers mois" },
  { valeur: "annee", libelle: "Année en cours" },
  { valeur: "tout", libelle: "Toutes les périodes" },
  { valeur: "perso", libelle: "Dates choisies" },
];

export const STATUTS_FILTRE = [
  { valeur: "SOUMIS", libelle: "À valider" },
  { valeur: "VALIDE", libelle: "Validés" },
] as const;

export const LIBELLES_STRUCTURE: Record<string, string> = {
  HOPITAL: "Hôpital",
  CLINIQUE: "Clinique",
  LABORATOIRE: "Laboratoire",
  PHARMACIE: "Pharmacie",
  CABINET_MEDICAL: "Cabinet médical",
  AUTRE: "Autre",
};

export interface FiltresAutorite {
  raccourci: RaccourciPeriode;
  // AAAA-MM-JJ ; null = pas de borne.
  du: string | null;
  au: string | null;
  etablissements: string[];
  communes: string[];
  structures: string[];
  statut: "SOUMIS" | "VALIDE" | null;
}

export type ParametresUrl = Record<string, string | string[] | undefined>;

function un(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function listeUrl(v: string | string[] | undefined): string[] {
  return (un(v) ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Bornes d'un raccourci, calculées sur le début des périodes des rapports :
// « 3 derniers mois » = du 1er jour du mois d'il y a 2 mois à aujourd'hui.
export function bornesRaccourci(raccourci: RaccourciPeriode, maintenant = new Date()): { du: string | null; au: string | null } {
  const annee = maintenant.getUTCFullYear();
  const mois = maintenant.getUTCMonth();
  const premierDuMois = (decalage: number) => iso(new Date(Date.UTC(annee, mois - decalage, 1)));
  switch (raccourci) {
    case "3m":
      return { du: premierDuMois(2), au: iso(maintenant) };
    case "6m":
      return { du: premierDuMois(5), au: iso(maintenant) };
    case "12m":
      return { du: premierDuMois(11), au: iso(maintenant) };
    case "annee":
      return { du: `${annee}-01-01`, au: iso(maintenant) };
    default:
      return { du: null, au: null };
  }
}

export function lireFiltres(params: ParametresUrl, raccourciParDefaut: RaccourciPeriode = "12m"): FiltresAutorite {
  const brut = un(params.periode);
  const raccourci = (RACCOURCIS_PERIODE.find((r) => r.valeur === brut)?.valeur ?? raccourciParDefaut) as RaccourciPeriode;
  let { du, au } = bornesRaccourci(raccourci);
  if (raccourci === "perso") {
    const d = un(params.du);
    const a = un(params.au);
    du = d && RE_DATE.test(d) ? d : null;
    au = a && RE_DATE.test(a) ? a : null;
    if (du && au && du > au) [du, au] = [au, du];
  }
  const statut = un(params.statut);
  return {
    raccourci,
    du,
    au,
    etablissements: listeUrl(params.etab),
    communes: listeUrl(params.commune),
    structures: listeUrl(params.structure).filter((s) => s in LIBELLES_STRUCTURE),
    statut: statut === "SOUMIS" || statut === "VALIDE" ? statut : null,
  };
}

// Paramètres de l'API (/autorite/synthese, /transmissions, /donnees).
export function requeteApi(f: FiltresAutorite, extra: Record<string, string | undefined> = {}): string {
  const q = new URLSearchParams();
  if (f.du) q.set("du", f.du);
  if (f.au) q.set("au", f.au);
  if (f.etablissements.length) q.set("organisations", f.etablissements.join(","));
  if (f.communes.length) q.set("communes", f.communes.join(","));
  if (f.structures.length) q.set("structures", f.structures.join(","));
  if (f.statut) q.set("statut", f.statut);
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
  return q.toString();
}

// Résumé lisible des filtres actifs (sous-titres des graphiques, exports).
export function resumeFiltres(f: FiltresAutorite, noms: Record<string, string> = {}): string {
  const morceaux: string[] = [];
  const raccourci = RACCOURCIS_PERIODE.find((r) => r.valeur === f.raccourci);
  if (f.raccourci === "perso") {
    const fr = (d: string) => d.split("-").reverse().join("/");
    morceaux.push(f.du && f.au ? `du ${fr(f.du)} au ${fr(f.au)}` : f.du ? `depuis le ${fr(f.du)}` : f.au ? `jusqu'au ${fr(f.au)}` : "toutes les périodes");
  } else if (raccourci) {
    morceaux.push(raccourci.libelle.toLowerCase());
  }
  if (f.etablissements.length) {
    morceaux.push(
      f.etablissements.length === 1 && noms[f.etablissements[0]] ? noms[f.etablissements[0]] : `${f.etablissements.length} établissements`,
    );
  }
  if (f.communes.length) morceaux.push(f.communes.length === 1 ? f.communes[0] : `${f.communes.length} communes`);
  if (f.structures.length) morceaux.push(f.structures.map((s) => LIBELLES_STRUCTURE[s] ?? s).join(", "));
  if (f.statut) morceaux.push(STATUTS_FILTRE.find((s) => s.valeur === f.statut)!.libelle.toLowerCase());
  return morceaux.join(" · ");
}
