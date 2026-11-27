import { PARCOURS_FORMATIONS_EH } from "@dps/shared";
import type { Formation, NiveauCritere, TypeEtablissement } from "@/lib/types";

// Catalogue officiel des formations (ROADMAP_FORMATIONS_VERIFICATION.md §7).

export const LIBELLES_NIVEAU: Record<NiveauCritere, string> = {
  ESSENTIEL: "Essentiel",
  FONDAMENTAL: "Fondamental",
  AVANCE: "Avancé",
};

export const LIBELLES_TYPE: Record<TypeEtablissement, string> = {
  EH: "Établissements hospitaliers (EH)",
  ESPC: "Établissements de soins de premier contact (ESPC)",
};

// Couverture par défaut d'une formation sans image : teinte du domaine ARS.
export const TEINTES_DOMAINE: Record<string, { fond: string; accent: string }> = {
  A: { fond: "from-[#1657CC] to-[#0A2A6B]", accent: "bg-[#5B8DEF]" },
  B: { fond: "from-[#0F8A6E] to-[#07463A]", accent: "bg-[#4CC3A5]" },
  C: { fond: "from-[#B23A48] to-[#5C1621]", accent: "bg-[#E07A86]" },
  D: { fond: "from-[#C0761A] to-[#5E3608]", accent: "bg-[#F0AE5A]" },
  E: { fond: "from-[#6A44B8] to-[#2F1A5E]", accent: "bg-[#A68BE8]" },
};
export const TEINTE_PAR_DEFAUT = { fond: "from-[#3B4656] to-[#1B222C]", accent: "bg-[#8A96A8]" };

// Prix par personne le plus bas (tranche la plus avantageuse).
export const prixMinimum = (f: Formation) => Math.min(f.prixPersonne1a5, f.prixPersonne6a10, f.prixPersonne11Plus);

// Parcours EH : identifiant stable dans l'URL.
export const PARCOURS = [
  { id: "socle", nom: PARCOURS_FORMATIONS_EH.socle.titre, criteres: PARCOURS_FORMATIONS_EH.socle.etapes.flatMap((e) => e.criteres) },
  ...PARCOURS_FORMATIONS_EH.parcours.map((p, i) => ({ id: `p${i + 1}`, nom: p.nom, criteres: p.criteres })),
];

export const TRANCHES_DUREE = [
  { id: "courte", libelle: "3 h ou moins", test: (h: number) => h <= 3 },
  { id: "moyenne", libelle: "De 3 à 7 h", test: (h: number) => h > 3 && h <= 7 },
  { id: "longue", libelle: "Plus de 7 h", test: (h: number) => h > 7 },
] as const;

export const TRIS = [
  { id: "critere", libelle: "Ordre des critères ARS" },
  { id: "titre", libelle: "Titre (A → Z)" },
  { id: "duree-asc", libelle: "Durée croissante" },
  { id: "duree-desc", libelle: "Durée décroissante" },
] as const;

export interface FiltresCatalogue {
  type: TypeEtablissement;
  niveau?: NiveauCritere;
  domaine?: string;
  parcours?: string;
  q?: string;
  public?: string;
  duree?: string;
  tri?: string;
}

const normaliser = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filtrerFormations(formations: Formation[], f: FiltresCatalogue): Formation[] {
  const parcours = f.type === "EH" && f.parcours ? PARCOURS.find((p) => p.id === f.parcours) : undefined;
  const q = f.q ? normaliser(f.q.trim()) : "";
  const pub = f.public ? normaliser(f.public.trim()) : "";
  const tranche = TRANCHES_DUREE.find((t) => t.id === f.duree);
  const liste = formations.filter((x) => {
    if (x.typeEtablissement !== f.type) return false;
    if (f.niveau && x.niveau !== f.niveau) return false;
    if (f.domaine && x.domaineCode !== f.domaine) return false;
    if (parcours && !(x.critere && parcours.criteres.includes(x.critere))) return false;
    if (q && !normaliser([x.titre, x.critere, x.contenus, x.domaine].filter(Boolean).join(" ")).includes(q)) return false;
    if (pub && !normaliser(x.publicCible ?? "").includes(pub)) return false;
    if (tranche && (x.dureeHeures === null || !tranche.test(x.dureeHeures))) return false;
    return true;
  });
  const duree = (x: Formation) => x.dureeHeures ?? 0;
  switch (f.tri) {
    case "titre":
      return liste.sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
    case "duree-asc":
      return liste.sort((a, b) => duree(a) - duree(b));
    case "duree-desc":
      return liste.sort((a, b) => duree(b) - duree(a));
    default:
      return liste.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  }
}

// Domaines présents dans le catalogue d'un type, dans l'ordre A → E.
export function domainesDe(formations: Formation[], type: TypeEtablissement) {
  const vus = new Map<string, string>();
  for (const f of formations) {
    if (f.typeEtablissement === type && f.domaineCode && f.domaine && !vus.has(f.domaineCode)) vus.set(f.domaineCode, f.domaine);
  }
  return [...vus.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([code, nom]) => ({ code, nom }));
}
