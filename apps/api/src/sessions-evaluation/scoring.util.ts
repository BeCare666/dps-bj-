import { TypeReponse } from "../generated/prisma/enums.js";

// RM1 — un critère n'est validé que si tous ses éléments mesurables sont positifs.
// Pour OUI_NON, positif = valeur strictement `true`. Pour TEXTE/CHOIX, faute de règle
// explicite dans le CDC, on considère "répondu" (valeur non vide) comme positif —
// à affiner une fois le vrai référentiel de grilles fourni.
export function elementEstPositif(typeReponse: TypeReponse, valeur: unknown): boolean {
  if (typeReponse === TypeReponse.OUI_NON) {
    return valeur === true;
  }
  if (valeur === null || valeur === undefined) return false;
  if (typeof valeur === "string") return valeur.trim().length > 0;
  return true;
}

interface ElementMesurableStructure {
  id: string;
  typeReponse: TypeReponse;
}

interface CritereStructure {
  id: string;
  code: string;
  libelle: string;
  elementsMesurables: ElementMesurableStructure[];
}

interface NormeStructure {
  criteres: CritereStructure[];
}

interface DomaineStructure {
  id: string;
  nom: string;
  normes: NormeStructure[];
}

export interface GrilleStructure {
  domaines: DomaineStructure[];
}

export interface ScoreParDomaine {
  domaineId: string;
  nom: string;
  criteresValides: number;
  criteresTotal: number;
  scorePct: number;
}

export interface CritereNonValide {
  critereId: string;
  code: string;
  libelle: string;
  domaineNom: string;
}

export interface ResultatScore {
  scoreGlobal: number;
  parDomaine: ScoreParDomaine[];
  criteresNonValides: CritereNonValide[];
}

function arrondiPourcentage(numerateur: number, denominateur: number): number {
  if (denominateur === 0) return 0;
  return Math.round((numerateur / denominateur) * 10000) / 100;
}

export function calculerScore(grille: GrilleStructure, reponsesParElement: Map<string, unknown>): ResultatScore {
  const parDomaine: ScoreParDomaine[] = [];
  const criteresNonValides: CritereNonValide[] = [];
  let critieresValidesTotal = 0;
  let criteresTotal = 0;

  for (const domaine of grille.domaines) {
    let validesDansDomaine = 0;
    let totalDansDomaine = 0;

    for (const norme of domaine.normes) {
      for (const critere of norme.criteres) {
        totalDansDomaine++;
        criteresTotal++;

        const valide =
          critere.elementsMesurables.length > 0 &&
          critere.elementsMesurables.every((element) =>
            elementEstPositif(element.typeReponse, reponsesParElement.get(element.id)),
          );

        if (valide) {
          validesDansDomaine++;
          critieresValidesTotal++;
        } else {
          criteresNonValides.push({
            critereId: critere.id,
            code: critere.code,
            libelle: critere.libelle,
            domaineNom: domaine.nom,
          });
        }
      }
    }

    parDomaine.push({
      domaineId: domaine.id,
      nom: domaine.nom,
      criteresValides: validesDansDomaine,
      criteresTotal: totalDansDomaine,
      scorePct: arrondiPourcentage(validesDansDomaine, totalDansDomaine),
    });
  }

  return {
    scoreGlobal: arrondiPourcentage(critieresValidesTotal, criteresTotal),
    parDomaine,
    criteresNonValides,
  };
}
