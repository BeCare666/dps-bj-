import type { BlocTableau, Colonne, DefinitionFormulaire, Ligne, ValeursRapport } from "./types.js";

export type NatureCase = "hachuree" | "fusionnee" | "saisie" | "calculee";

export function cleCase(blocId: string, ligneId: string, colonneId: string): string {
  return `${blocId}.${ligneId}.${colonneId}`;
}

export function cleChamp(blocId: string, champId: string): string {
  return `${blocId}.${champId}`;
}

export function clePrecision(blocId: string, ligneId: string): string {
  return `${blocId}.${ligneId}.precision`;
}

function colonne(bloc: BlocTableau, id: string): Colonne {
  const c = bloc.colonnes.find((x) => x.id === id);
  if (!c) throw new Error(`Colonne inconnue ${bloc.id}.${id}`);
  return c;
}

function ligne(bloc: BlocTableau, id: string): Ligne {
  const l = bloc.lignes.find((x) => x.id === id);
  if (!l) throw new Error(`Ligne inconnue ${bloc.id}.${id}`);
  return l;
}

function estHachuree(l: Ligne, colonneId: string): boolean {
  return l.hachures?.includes(colonneId) ?? false;
}

function estFusionneeSecondaire(l: Ligne, colonneId: string): boolean {
  return (l.fusions ?? []).some((f) => f.colonnes.indexOf(colonneId) > 0);
}

// Nature d'une case :
// - hachurée : rien à inscrire ;
// - fusionnée : couverte par une case fusionnée voisine (valeur portée par la première) ;
// - calculée : ligne de total ou colonne de total dont au moins une composante existe ;
// - saisie : à remplir. Une colonne de total dont toutes les composantes sont
//   hachurées ou fusionnées sur la ligne devient une case à saisir.
export function natureCase(bloc: BlocTableau, l: Ligne, c: Colonne): NatureCase {
  if (l.section) return "hachuree";
  if (estHachuree(l, c.id)) return "hachuree";
  if (estFusionneeSecondaire(l, c.id)) return "fusionnee";
  if (l.somme) return c.horsTotal ? "saisie" : "calculee";
  if (c.somme) {
    const composantesActives = c.somme.filter((id) => {
      const nature = natureCase(bloc, l, colonne(bloc, id));
      return nature !== "hachuree" && nature !== "fusionnee";
    });
    return composantesActives.length > 0 ? "calculee" : "saisie";
  }
  return "saisie";
}

function nombre(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

// Valeur affichée d'une case : null si hachurée ou fusionnée ; pour une case
// calculée, somme des composantes (case vide = 0) ; pour une case saisie, la
// valeur saisie ou undefined si vide.
export function valeurCase(
  bloc: BlocTableau,
  l: Ligne,
  c: Colonne,
  valeurs: ValeursRapport,
): number | null | undefined {
  const nature = natureCase(bloc, l, c);
  if (nature === "hachuree" || nature === "fusionnee") return null;
  if (nature === "saisie") {
    const v = valeurs[cleCase(bloc.id, l.id, c.id)];
    return typeof v === "number" ? v : undefined;
  }

  if (l.somme) {
    const composantes = l.somme.map((id) => valeurCase(bloc, ligne(bloc, id), c, valeurs));
    if (composantes.every((v) => v === null)) return null;
    return arrondir(composantes.reduce<number>((t, v) => t + nombre(v), 0));
  }

  const composantes = (c.somme ?? []).map((id) => valeurCase(bloc, l, colonne(bloc, id), valeurs));
  return arrondir(composantes.reduce<number>((t, v) => t + nombre(v), 0));
}

function arrondir(v: number): number {
  return Math.round(v * 100) / 100;
}

export interface DescriptionSaisie {
  cle: string;
  nature: "entier" | "decimal" | "texte" | "texte_long" | "oui_non";
  // Obligatoire à la soumission.
  obligatoire: boolean;
}

// Toutes les saisies possibles d'un formulaire (cases, champs, oui/non,
// précisions). Les cases numériques et les oui/non sont obligatoires à la
// soumission ; les textes ne le sont pas.
export function saisiesFormulaire(def: DefinitionFormulaire): DescriptionSaisie[] {
  const saisies: DescriptionSaisie[] = [];
  for (const bloc of def.blocs) {
    if (bloc.type === "tableau") {
      for (const l of bloc.lignes) {
        if (l.precision) saisies.push({ cle: clePrecision(bloc.id, l.id), nature: "texte", obligatoire: false });
        for (const c of bloc.colonnes) {
          if (natureCase(bloc, l, c) === "saisie") {
            saisies.push({ cle: cleCase(bloc.id, l.id, c.id), nature: c.decimal ? "decimal" : "entier", obligatoire: true });
          }
        }
      }
    } else if (bloc.type === "oui_non") {
      for (const e of bloc.elements) saisies.push({ cle: cleChamp(bloc.id, e.id), nature: "oui_non", obligatoire: true });
    } else {
      for (const ch of bloc.champs) {
        saisies.push({
          cle: cleChamp(bloc.id, ch.id),
          nature: ch.nature === "nombre" ? "entier" : ch.nature,
          obligatoire: ch.nature === "nombre",
        });
      }
    }
  }
  return saisies;
}

export const LONGUEUR_MAX_TEXTE = 191;
export const LONGUEUR_MAX_TEXTE_LONG = 2000;

// Vérifie des valeurs saisies : clés connues et types conformes. Les valeurs
// absentes sont acceptées (brouillon) ; voir `saisiesManquantes` pour la
// soumission.
export function erreursValeurs(def: DefinitionFormulaire, valeurs: Record<string, unknown>): string[] {
  const parCle = new Map(saisiesFormulaire(def).map((s) => [s.cle, s]));
  const erreurs: string[] = [];
  for (const [cle, v] of Object.entries(valeurs)) {
    const saisie = parCle.get(cle);
    if (!saisie) {
      erreurs.push(`Case inconnue ou non saisissable : ${cle}`);
      continue;
    }
    switch (saisie.nature) {
      case "entier":
        if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 1_000_000_000) {
          erreurs.push(`${cle} : entier positif attendu`);
        }
        break;
      case "decimal":
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1_000_000_000) {
          erreurs.push(`${cle} : nombre positif attendu`);
        }
        break;
      case "oui_non":
        if (typeof v !== "boolean") erreurs.push(`${cle} : oui ou non attendu`);
        break;
      case "texte":
        if (typeof v !== "string" || v.length > LONGUEUR_MAX_TEXTE) {
          erreurs.push(`${cle} : texte de ${LONGUEUR_MAX_TEXTE} caractères maximum attendu`);
        }
        break;
      case "texte_long":
        if (typeof v !== "string" || v.length > LONGUEUR_MAX_TEXTE_LONG) {
          erreurs.push(`${cle} : texte de ${LONGUEUR_MAX_TEXTE_LONG} caractères maximum attendu`);
        }
        break;
    }
  }
  return erreurs;
}

export function saisiesManquantes(def: DefinitionFormulaire, valeurs: Record<string, unknown>): string[] {
  return saisiesFormulaire(def)
    .filter((s) => s.obligatoire && (valeurs[s.cle] === undefined || valeurs[s.cle] === null))
    .map((s) => s.cle);
}

// Cohérence interne d'une définition : ids uniques, références existantes.
export function erreursDefinition(def: DefinitionFormulaire): string[] {
  const erreurs: string[] = [];
  const blocs = new Set<string>();
  for (const bloc of def.blocs) {
    if (blocs.has(bloc.id)) erreurs.push(`Bloc en double : ${bloc.id}`);
    blocs.add(bloc.id);
    if (bloc.type !== "tableau") continue;
    const colonnes = new Set(bloc.colonnes.map((c) => c.id));
    const lignes = new Set(bloc.lignes.map((l) => l.id));
    if (colonnes.size !== bloc.colonnes.length) erreurs.push(`${bloc.id} : colonne en double`);
    if (lignes.size !== bloc.lignes.length) erreurs.push(`${bloc.id} : ligne en double`);
    for (const c of bloc.colonnes) {
      for (const id of c.somme ?? []) if (!colonnes.has(id)) erreurs.push(`${bloc.id}.${c.id} : somme sur colonne inconnue ${id}`);
    }
    for (const l of bloc.lignes) {
      for (const id of l.somme ?? []) if (!lignes.has(id)) erreurs.push(`${bloc.id}.${l.id} : somme sur ligne inconnue ${id}`);
      for (const id of l.hachures ?? []) if (!colonnes.has(id)) erreurs.push(`${bloc.id}.${l.id} : hachure sur colonne inconnue ${id}`);
      for (const f of l.fusions ?? []) {
        for (const id of f.colonnes) if (!colonnes.has(id)) erreurs.push(`${bloc.id}.${l.id} : fusion sur colonne inconnue ${id}`);
      }
    }
  }
  return erreurs;
}
