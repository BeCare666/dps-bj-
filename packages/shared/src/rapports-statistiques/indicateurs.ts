// Indicateurs des tableaux de bord des autorités (ROADMAP_ESPACE_AUTORITES.md) :
// une case du formulaire (saisie ou calculée), un Oui/Non ou un champ nombre.
// Rien n'est ajouté aux formulaires : chaque indicateur est une case imprimée.
import { cleCase, cleChamp, natureCase, valeurCase } from "./calcul.js";
import { bornesPeriode, periodeDeDate } from "./periodes.js";
import type { DefinitionFormulaire, Periodicite } from "./types.js";

export interface Indicateur {
  cle: string;
  blocId: string;
  // Titre du bloc (ou en-tête de la colonne des libellés à défaut).
  bloc: string;
  nature: "nombre" | "oui_non";
  // Case de tableau : ligne et colonne.
  ligneId?: string;
  ligne?: string;
  colonneId?: string;
  colonne?: string[];
  calculee?: boolean;
  // Champ ou élément Oui/Non.
  libelle?: string;
}

function titreBloc(def: DefinitionFormulaire, blocId: string): string {
  const bloc = def.blocs.find((b) => b.id === blocId);
  if (!bloc) return blocId;
  if (bloc.type === "tableau") return bloc.titre ?? bloc.enteteLibelle ?? def.titre;
  return bloc.titre ?? def.titre;
}

// Tous les indicateurs d'un formulaire : cases saisies ou calculées des
// tableaux (hors hachurées et fusionnées), Oui/Non, champs nombre.
export function indicateursFormulaire(def: DefinitionFormulaire): Indicateur[] {
  const liste: Indicateur[] = [];
  for (const bloc of def.blocs) {
    const titre = titreBloc(def, bloc.id);
    if (bloc.type === "tableau") {
      for (const l of bloc.lignes) {
        if (l.section) continue;
        for (const c of bloc.colonnes) {
          const nature = natureCase(bloc, l, c);
          if (nature === "hachuree" || nature === "fusionnee") continue;
          liste.push({
            cle: cleCase(bloc.id, l.id, c.id),
            blocId: bloc.id,
            bloc: titre,
            nature: "nombre",
            ligneId: l.id,
            ligne: l.sousLibelle ? `${l.libelle} — ${l.sousLibelle}` : l.libelle,
            colonneId: c.id,
            colonne: c.entetes,
            calculee: nature === "calculee",
          });
        }
      }
    } else if (bloc.type === "oui_non") {
      for (const e of bloc.elements) {
        liste.push({ cle: cleChamp(bloc.id, e.id), blocId: bloc.id, bloc: titre, nature: "oui_non", libelle: e.libelle });
      }
    } else {
      for (const ch of bloc.champs) {
        if (ch.nature !== "nombre") continue;
        liste.push({ cle: cleChamp(bloc.id, ch.id), blocId: bloc.id, bloc: titre, nature: "nombre", libelle: ch.libelle });
      }
    }
  }
  return liste;
}

// Valeur d'un indicateur dans un rapport : nombre (case calculée comprise),
// booléen (Oui/Non) ou null si la case est vide / inconnue.
export function valeurIndicateur(
  def: DefinitionFormulaire,
  cle: string,
  valeurs: Record<string, unknown>,
): number | boolean | null {
  const [blocId, ligneId, colonneId] = cle.split(".");
  const bloc = def.blocs.find((b) => b.id === blocId);
  if (!bloc) return null;
  if (bloc.type === "tableau") {
    const l = bloc.lignes.find((x) => x.id === ligneId);
    const c = bloc.colonnes.find((x) => x.id === colonneId);
    if (!l || !c) return null;
    const v = valeurCase(bloc, l, c, valeurs as Record<string, number>);
    return typeof v === "number" ? v : null;
  }
  const v = valeurs[cle];
  if (bloc.type === "oui_non") return typeof v === "boolean" ? v : null;
  return typeof v === "number" ? v : null;
}

// Périodes d'un formulaire dont le début tombe entre deux dates (incluses),
// dans l'ordre chronologique. Dates au format AAAA-MM-JJ (UTC).
export function periodesEntre(periodicite: Periodicite, du: Date, au: Date): string[] {
  const periodes: string[] = [];
  if (du.getTime() > au.getTime()) return periodes;
  let periode = periodeDeDate(periodicite, du);
  let bornes = bornesPeriode(periodicite, periode)!;
  if (bornes.debut.getTime() < du.getTime()) {
    periode = periodeDeDate(periodicite, new Date(bornes.fin.getTime() + 86_400_000));
    bornes = bornesPeriode(periodicite, periode)!;
  }
  while (bornes.debut.getTime() <= au.getTime()) {
    periodes.push(periode);
    periode = periodeDeDate(periodicite, new Date(bornes.fin.getTime() + 86_400_000));
    bornes = bornesPeriode(periodicite, periode)!;
  }
  return periodes;
}
