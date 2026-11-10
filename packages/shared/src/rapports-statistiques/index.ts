import type { DefinitionFormulaire } from "./types.js";
import { BS_A } from "./formulaires/bs-a.js";
import { PNLP1 } from "./formulaires/pnlp1.js";
import { PNLMNT1, PNLMNT2 } from "./formulaires/pnlmnt.js";
import { SIMR_HEBDO } from "./formulaires/simr-hebdo.js";
import { TRANSFUSION } from "./formulaires/transfusion.js";

export * from "./types.js";
export * from "./calcul.js";
export * from "./periodes.js";
export * from "./indicateurs.js";

// Ordre d'affichage : celui des photos fournies.
export const FORMULAIRES_STATISTIQUES: readonly DefinitionFormulaire[] = [
  BS_A,
  PNLP1,
  PNLMNT1,
  PNLMNT2,
  SIMR_HEBDO,
  TRANSFUSION,
];

export function formulaireStatistique(code: string): DefinitionFormulaire | undefined {
  return FORMULAIRES_STATISTIQUES.find((f) => f.code === code);
}
