import { TypeReponse } from "../generated/prisma/enums.js";

// Réponse à un élément mesurable de type OUI_NON (libellé affiché :
// « Présent / Absent / Observations »). Les booléens des sessions antérieures
// restent lus : true = présent, false = absent.
export const REPONSE_PRESENT = "PRESENT";
export const REPONSE_ABSENT = "ABSENT";
export const REPONSE_OBSERVATION = "OBSERVATION";
export const VALEURS_PRESENCE = [REPONSE_PRESENT, REPONSE_ABSENT, REPONSE_OBSERVATION] as const;

export function estObservation(valeur: unknown): boolean {
  return valeur === REPONSE_OBSERVATION;
}

// Pour OUI_NON, positif = « Présent ». Pour TEXTE/CHOIX, faute de règle
// explicite dans le CDC, « répondu » (valeur non vide) vaut positif.
export function elementEstPositif(typeReponse: TypeReponse, valeur: unknown): boolean {
  if (typeReponse === TypeReponse.OUI_NON) {
    return valeur === REPONSE_PRESENT || valeur === true;
  }
  if (valeur === null || valeur === undefined) return false;
  if (typeof valeur === "string") return valeur.trim().length > 0;
  return true;
}

// Règle d'attribution du score d'un critère, selon sa catégorie (manuels ARS
// EH et ESPC, § 2.2 ; synthèse des grilles Excel fournies) :
// - essentiel : 1 si tous les documents à examiner sont présents, sinon 0 ;
// - fondamental et avancé : 1 si au moins 80 % des documents sont présents,
//   0,5 de 30 à 79 %, 0 en dessous de 30 % (« moins de 30 % » = 0).
// Une catégorie absente ou inconnue (grilles de test, grilles créées dans
// l'éditeur) suit la règle de l'essentiel, celle qui était appliquée jusqu'ici.
export type RegleCritere = "BINAIRE" | "PALIERS";

export function regleDeCategorie(categorie: string | null | undefined): RegleCritere {
  const c = (categorie ?? "").trim().toLowerCase();
  return c.startsWith("fondamental") || c.startsWith("avanc") ? "PALIERS" : "BINAIRE";
}

export const SEUIL_RESPECTE_PCT = 80;
export const SEUIL_PARTIEL_PCT = 30;

export function scoreCritere(regle: RegleCritere, presents: number, evalues: number): 0 | 0.5 | 1 {
  if (evalues === 0) return 0;
  if (regle === "BINAIRE") return presents === evalues ? 1 : 0;
  const pct = (presents / evalues) * 100;
  if (pct >= SEUIL_RESPECTE_PCT) return 1;
  if (pct >= SEUIL_PARTIEL_PCT) return 0.5;
  return 0;
}

interface ElementMesurableStructure {
  id: string;
  libelle?: string;
  typeReponse: TypeReponse;
  // §6.6 — absent (anciennes données / tests) = l'élément entre dans le score.
  entreDansScore?: boolean;
}

interface CritereStructure {
  id: string;
  code: string;
  libelle: string;
  categorie?: string | null;
  recommandation?: string | null;
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
  // Critères notés 1.
  criteresValides: number;
  // Critères notés 0,5 (fondamentaux et avancés uniquement).
  criteresPartiels: number;
  criteresTotal: number;
  // Critères dont tous les documents ont la réponse « Observations » : non
  // calculés, exclus du dénominateur.
  criteresNonCalcules: number;
  criteresApplicables: number;
  scoreObtenu: number;
  scorePct: number;
}

export interface DocumentNonValide {
  elementMesurableId: string;
  libelle: string;
  // Réponse « Absent », ou aucune réponse.
  reponse: "ABSENT" | "SANS_REPONSE";
}

export interface CritereNonValide {
  critereId: string;
  code: string;
  libelle: string;
  domaineNom: string;
  // 0 = non respecté ; 0,5 = partiellement respecté.
  score: number;
  documentsPresents: number;
  documentsEvalues: number;
  // §6.4 — documents à examiner manquants pour ce critère.
  documentsNonValides: DocumentNonValide[];
  recommandation: string | null;
}

export interface CritereNonCalcule {
  critereId: string;
  code: string;
  libelle: string;
  domaineNom: string;
}

export interface ObservationSaisie {
  elementMesurableId: string;
  critereCode: string;
  libelle: string;
  commentaire: string | null;
}

export interface ResultatScore {
  scoreGlobal: number;
  parDomaine: ScoreParDomaine[];
  criteresNonValides: CritereNonValide[];
  criteresNonCalcules: CritereNonCalcule[];
  observations: ObservationSaisie[];
}

function arrondiPourcentage(numerateur: number, denominateur: number): number {
  if (denominateur === 0) return 0;
  return Math.round((numerateur / denominateur) * 10000) / 100;
}

function entreDansScore(element: ElementMesurableStructure): boolean {
  return element.entreDansScore ?? true;
}

// RM1 / §6.3 — score par critère selon sa catégorie, puis pourcentage
// = score obtenu ÷ critères applicables. Seuls les documents à examiner
// comptent ; un document sans réponse compte comme absent ; un document à
// « Observations » n'est pas calculé.
export function calculerScore(
  grille: GrilleStructure,
  reponsesParElement: Map<string, unknown>,
  commentairesParElement: Map<string, string | null> = new Map(),
): ResultatScore {
  const parDomaine: ScoreParDomaine[] = [];
  const criteresNonValides: CritereNonValide[] = [];
  const criteresNonCalcules: CritereNonCalcule[] = [];
  const observations: ObservationSaisie[] = [];
  let scoreTotal = 0;
  let applicablesTotal = 0;

  for (const domaine of grille.domaines) {
    const ligne: ScoreParDomaine = {
      domaineId: domaine.id,
      nom: domaine.nom,
      criteresValides: 0,
      criteresPartiels: 0,
      criteresTotal: 0,
      criteresNonCalcules: 0,
      criteresApplicables: 0,
      scoreObtenu: 0,
      scorePct: 0,
    };

    for (const norme of domaine.normes) {
      for (const critere of norme.criteres) {
        ligne.criteresTotal++;

        for (const element of critere.elementsMesurables) {
          if (estObservation(reponsesParElement.get(element.id))) {
            observations.push({
              elementMesurableId: element.id,
              critereCode: critere.code,
              libelle: element.libelle ?? "",
              commentaire: commentairesParElement.get(element.id) ?? null,
            });
          }
        }

        const documents = critere.elementsMesurables.filter(entreDansScore);
        const evalues = documents.filter((element) => !estObservation(reponsesParElement.get(element.id)));

        // Documents tous à « Observations » : le critère n'est pas calculé.
        // (Un critère sans aucun document ne peut pas être validé
        // documentairement : il reste compté, à 0.)
        if (documents.length > 0 && evalues.length === 0) {
          ligne.criteresNonCalcules++;
          criteresNonCalcules.push({ critereId: critere.id, code: critere.code, libelle: critere.libelle, domaineNom: domaine.nom });
          continue;
        }

        const documentsNonValides: DocumentNonValide[] = evalues
          .filter((element) => !elementEstPositif(element.typeReponse, reponsesParElement.get(element.id)))
          .map((element) => ({
            elementMesurableId: element.id,
            libelle: element.libelle ?? "",
            reponse: reponsesParElement.has(element.id) ? "ABSENT" : "SANS_REPONSE",
          }));
        const presents = evalues.length - documentsNonValides.length;
        const score = scoreCritere(regleDeCategorie(critere.categorie), presents, evalues.length);

        ligne.criteresApplicables++;
        ligne.scoreObtenu += score;
        if (score === 1) {
          ligne.criteresValides++;
        } else {
          if (score === 0.5) ligne.criteresPartiels++;
          criteresNonValides.push({
            critereId: critere.id,
            code: critere.code,
            libelle: critere.libelle,
            domaineNom: domaine.nom,
            score,
            documentsPresents: presents,
            documentsEvalues: evalues.length,
            documentsNonValides,
            recommandation: critere.recommandation ?? null,
          });
        }
      }
    }

    ligne.scorePct = arrondiPourcentage(ligne.scoreObtenu, ligne.criteresApplicables);
    scoreTotal += ligne.scoreObtenu;
    applicablesTotal += ligne.criteresApplicables;
    parDomaine.push(ligne);
  }

  return {
    scoreGlobal: arrondiPourcentage(scoreTotal, applicablesTotal),
    parDomaine,
    criteresNonValides,
    criteresNonCalcules,
    observations,
  };
}
