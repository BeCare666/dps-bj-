import { calculerScore, elementEstPositif, regleDeCategorie, scoreCritere, type GrilleStructure } from "./scoring.util.js";
import { TypeReponse } from "../generated/prisma/enums.js";

describe("elementEstPositif", () => {
  it("OUI_NON n'est positif que si « Présent » (ou true, sessions antérieures)", () => {
    expect(elementEstPositif(TypeReponse.OUI_NON, "PRESENT")).toBe(true);
    expect(elementEstPositif(TypeReponse.OUI_NON, true)).toBe(true);
    expect(elementEstPositif(TypeReponse.OUI_NON, "ABSENT")).toBe(false);
    expect(elementEstPositif(TypeReponse.OUI_NON, "OBSERVATION")).toBe(false);
    expect(elementEstPositif(TypeReponse.OUI_NON, false)).toBe(false);
    expect(elementEstPositif(TypeReponse.OUI_NON, "oui")).toBe(false);
    expect(elementEstPositif(TypeReponse.OUI_NON, undefined)).toBe(false);
  });

  it("TEXTE est positif si non vide", () => {
    expect(elementEstPositif(TypeReponse.TEXTE, "réponse")).toBe(true);
    expect(elementEstPositif(TypeReponse.TEXTE, "   ")).toBe(false);
    expect(elementEstPositif(TypeReponse.TEXTE, "")).toBe(false);
    expect(elementEstPositif(TypeReponse.TEXTE, null)).toBe(false);
  });

  it("CHOIX est positif si une valeur est présente", () => {
    expect(elementEstPositif(TypeReponse.CHOIX, "option-a")).toBe(true);
    expect(elementEstPositif(TypeReponse.CHOIX, undefined)).toBe(false);
  });
});

describe("calculerScore", () => {
  function grilleDeTest(): GrilleStructure {
    return {
      domaines: [
        {
          id: "dom-1",
          nom: "Domaine 1",
          normes: [
            {
              criteres: [
                {
                  id: "crit-1",
                  code: "C1",
                  libelle: "Critère 1",
                  elementsMesurables: [
                    { id: "el-1", typeReponse: TypeReponse.OUI_NON },
                    { id: "el-2", typeReponse: TypeReponse.OUI_NON },
                  ],
                },
                {
                  id: "crit-2",
                  code: "C2",
                  libelle: "Critère 2",
                  elementsMesurables: [{ id: "el-3", typeReponse: TypeReponse.OUI_NON }],
                },
              ],
            },
          ],
        },
        {
          id: "dom-2",
          nom: "Domaine 2",
          normes: [
            {
              criteres: [
                {
                  id: "crit-3",
                  code: "C3",
                  libelle: "Critère 3",
                  elementsMesurables: [{ id: "el-4", typeReponse: TypeReponse.OUI_NON }],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  it("un critère n'est validé que si TOUS ses éléments sont positifs (RM1)", () => {
    const reponses = new Map<string, unknown>([
      ["el-1", true],
      ["el-2", false], // fait échouer crit-1 malgré el-1 positif
      ["el-3", true],
      ["el-4", true],
    ]);

    const resultat = calculerScore(grilleDeTest(), reponses);

    expect(resultat.criteresNonValides.map((c) => c.critereId)).toEqual(["crit-1"]);
    expect(resultat.parDomaine.find((d) => d.domaineId === "dom-1")).toMatchObject({
      criteresValides: 1,
      criteresTotal: 2,
      scorePct: 50,
    });
    expect(resultat.parDomaine.find((d) => d.domaineId === "dom-2")).toMatchObject({
      criteresValides: 1,
      criteresTotal: 1,
      scorePct: 100,
    });
    expect(resultat.scoreGlobal).toBeCloseTo(66.67, 1);
  });

  it("un critère sans réponse du tout n'est pas validé", () => {
    const resultat = calculerScore(grilleDeTest(), new Map());
    expect(resultat.scoreGlobal).toBe(0);
    expect(resultat.criteresNonValides).toHaveLength(3);
  });

  it("un critère 100% répondu positivement obtient 100%", () => {
    const reponses = new Map<string, unknown>([
      ["el-1", true],
      ["el-2", true],
      ["el-3", true],
      ["el-4", true],
    ]);
    const resultat = calculerScore(grilleDeTest(), reponses);
    expect(resultat.scoreGlobal).toBe(100);
    expect(resultat.criteresNonValides).toHaveLength(0);
  });

  it("un critère sans aucun élément mesurable n'est jamais validé", () => {
    const grille: GrilleStructure = {
      domaines: [
        {
          id: "dom-1",
          nom: "Domaine 1",
          normes: [{ criteres: [{ id: "crit-vide", code: "C0", libelle: "Vide", elementsMesurables: [] }] }],
        },
      ],
    };
    const resultat = calculerScore(grille, new Map());
    expect(resultat.criteresNonValides.map((c) => c.critereId)).toEqual(["crit-vide"]);
  });
});

// §6.2 / §6.3 / §6.4 — seuls les éléments « document à examiner » (entreDansScore)
// comptent ; les documents manquants et la recommandation sont restitués.
describe("calculerScore — documents à examiner (§6.3)", () => {
  function grilleMixte(): GrilleStructure {
    return {
      domaines: [
        {
          id: "dom-1",
          nom: "Organisation",
          normes: [
            {
              criteres: [
                {
                  id: "crit-1",
                  code: "C1",
                  libelle: "Procédure de prévention des chutes",
                  recommandation: "Rédiger et diffuser la procédure.",
                  elementsMesurables: [
                    { id: "doc-1", libelle: "Procédure écrite", typeReponse: TypeReponse.OUI_NON, entreDansScore: true },
                    { id: "doc-2", libelle: "Registre des chutes", typeReponse: TypeReponse.OUI_NON, entreDansScore: true },
                    { id: "ent-1", libelle: "Entretien cadre", typeReponse: TypeReponse.OUI_NON, entreDansScore: false },
                  ],
                },
                {
                  id: "crit-2",
                  code: "C2",
                  libelle: "Observation seule",
                  elementsMesurables: [
                    { id: "obs-1", libelle: "Observation", typeReponse: TypeReponse.OUI_NON, entreDansScore: false },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  it("un entretien négatif n'invalide pas un critère dont tous les documents sont présents", () => {
    const reponses = new Map<string, unknown>([
      ["doc-1", true],
      ["doc-2", true],
      ["ent-1", false],
    ]);
    const resultat = calculerScore(grilleMixte(), reponses);
    expect(resultat.criteresNonValides.map((c) => c.critereId)).not.toContain("crit-1");
  });

  it("un seul document manquant invalide le critère ; documents manquants et recommandation restitués", () => {
    const reponses = new Map<string, unknown>([["doc-1", false]]);
    const resultat = calculerScore(grilleMixte(), reponses);
    const ecart = resultat.criteresNonValides.find((c) => c.critereId === "crit-1")!;
    expect(ecart.documentsNonValides).toEqual([
      { elementMesurableId: "doc-1", libelle: "Procédure écrite", reponse: "ABSENT" },
      { elementMesurableId: "doc-2", libelle: "Registre des chutes", reponse: "SANS_REPONSE" },
    ]);
    expect(ecart.recommandation).toBe("Rédiger et diffuser la procédure.");
  });

  it("un critère sans aucun document à examiner n'est pas validé (compté au total)", () => {
    const reponses = new Map<string, unknown>([
      ["doc-1", true],
      ["doc-2", true],
      ["obs-1", true],
    ]);
    const resultat = calculerScore(grilleMixte(), reponses);
    expect(resultat.scoreGlobal).toBe(50);
    expect(resultat.criteresNonValides.map((c) => c.critereId)).toEqual(["crit-2"]);
  });
});

// Grilles ARS mises à jour (mise_a_jour/) : réponses Présent / Absent /
// Observations, et règle de notation selon la catégorie du critère.
describe("règle de notation selon la catégorie (manuels ARS § 2.2)", () => {
  it("essentiel (et catégorie absente) : binaire ; fondamental et avancé : paliers", () => {
    expect(regleDeCategorie("Essentiel")).toBe("BINAIRE");
    expect(regleDeCategorie(null)).toBe("BINAIRE");
    expect(regleDeCategorie("Fondamental")).toBe("PALIERS");
    expect(regleDeCategorie("Avancé")).toBe("PALIERS");
  });

  it("binaire : 1 seulement si tous les documents évalués sont présents", () => {
    expect(scoreCritere("BINAIRE", 4, 4)).toBe(1);
    expect(scoreCritere("BINAIRE", 3, 4)).toBe(0);
  });

  it("paliers : ≥ 80 % → 1 ; 30 à 79 % → 0,5 ; < 30 % → 0", () => {
    expect(scoreCritere("PALIERS", 4, 5)).toBe(1); // 80 %
    expect(scoreCritere("PALIERS", 5, 5)).toBe(1);
    expect(scoreCritere("PALIERS", 3, 4)).toBe(0.5); // 75 %
    expect(scoreCritere("PALIERS", 3, 10)).toBe(0.5); // 30 %
    expect(scoreCritere("PALIERS", 1, 4)).toBe(0); // 25 %
    expect(scoreCritere("PALIERS", 0, 3)).toBe(0);
  });
});

describe("calculerScore — Présent / Absent / Observations", () => {
  function grille(categorie: string): GrilleStructure {
    const docs = (prefixe: string, n: number) =>
      Array.from({ length: n }, (_, i) => ({ id: `${prefixe}-${i + 1}`, libelle: `${prefixe} ${i + 1}`, typeReponse: TypeReponse.OUI_NON, entreDansScore: true }));
    return {
      domaines: [
        {
          id: "dom",
          nom: "Domaine",
          normes: [
            {
              criteres: [
                { id: "c1", code: "A.1.1.1", libelle: "Critère 1", categorie, elementsMesurables: docs("c1", 4) },
                { id: "c2", code: "A.1.1.2", libelle: "Critère 2", categorie, elementsMesurables: docs("c2", 2) },
              ],
            },
          ],
        },
      ],
    };
  }

  it("fondamental : 3 présents sur 4 = 0,5 ; score = somme ÷ critères applicables", () => {
    const reponses = new Map<string, unknown>([
      ["c1-1", "PRESENT"],
      ["c1-2", "PRESENT"],
      ["c1-3", "PRESENT"],
      ["c1-4", "ABSENT"],
      ["c2-1", "PRESENT"],
      ["c2-2", "PRESENT"],
    ]);
    const r = calculerScore(grille("Fondamental"), reponses);
    expect(r.scoreGlobal).toBe(75); // (0,5 + 1) / 2
    expect(r.parDomaine[0]).toMatchObject({ criteresValides: 1, criteresPartiels: 1, criteresApplicables: 2, scoreObtenu: 1.5, scorePct: 75 });
    expect(r.criteresNonValides).toHaveLength(1);
    expect(r.criteresNonValides[0]).toMatchObject({ code: "A.1.1.1", score: 0.5, documentsPresents: 3, documentsEvalues: 4 });
    expect(r.criteresNonValides[0].documentsNonValides).toEqual([{ elementMesurableId: "c1-4", libelle: "c1 4", reponse: "ABSENT" }]);
  });

  it("essentiel : la même réponse invalide le critère (0)", () => {
    const reponses = new Map<string, unknown>([
      ["c1-1", "PRESENT"],
      ["c1-2", "PRESENT"],
      ["c1-3", "PRESENT"],
      ["c1-4", "ABSENT"],
      ["c2-1", "PRESENT"],
      ["c2-2", "PRESENT"],
    ]);
    const r = calculerScore(grille("Essentiel"), reponses);
    expect(r.scoreGlobal).toBe(50);
    expect(r.criteresNonValides[0]).toMatchObject({ code: "A.1.1.1", score: 0 });
  });

  it("un document à « Observations » n'est pas calculé : ni présent, ni absent", () => {
    const reponses = new Map<string, unknown>([
      ["c1-1", "PRESENT"],
      ["c1-2", "PRESENT"],
      ["c1-3", "PRESENT"],
      ["c1-4", "OBSERVATION"],
      ["c2-1", "PRESENT"],
      ["c2-2", "PRESENT"],
    ]);
    const commentaires = new Map<string, string | null>([["c1-4", "Document en cours de signature"]]);
    for (const categorie of ["Essentiel", "Fondamental"]) {
      const r = calculerScore(grille(categorie), reponses, commentaires);
      expect(r.scoreGlobal).toBe(100);
      expect(r.criteresNonValides).toHaveLength(0);
      expect(r.observations).toEqual([
        { elementMesurableId: "c1-4", critereCode: "A.1.1.1", libelle: "c1 4", commentaire: "Document en cours de signature" },
      ]);
    }
  });

  it("un critère dont tous les documents sont à « Observations » est exclu du dénominateur", () => {
    const reponses = new Map<string, unknown>([
      ["c1-1", "OBSERVATION"],
      ["c1-2", "OBSERVATION"],
      ["c1-3", "OBSERVATION"],
      ["c1-4", "OBSERVATION"],
      ["c2-1", "PRESENT"],
      ["c2-2", "ABSENT"],
    ]);
    const r = calculerScore(grille("Fondamental"), reponses);
    expect(r.parDomaine[0]).toMatchObject({ criteresTotal: 2, criteresNonCalcules: 1, criteresApplicables: 1, scoreObtenu: 0.5 });
    expect(r.scoreGlobal).toBe(50);
    expect(r.criteresNonCalcules.map((c) => c.code)).toEqual(["A.1.1.1"]);
  });

  it("aucun critère calculable : score 0, sans division par zéro", () => {
    const reponses = new Map<string, unknown>(["c1-1", "c1-2", "c1-3", "c1-4", "c2-1", "c2-2"].map((id) => [id, "OBSERVATION"]));
    const r = calculerScore(grille("Avancé"), reponses);
    expect(r.scoreGlobal).toBe(0);
    expect(r.criteresNonCalcules).toHaveLength(2);
  });

  it("les réponses booléennes des sessions antérieures restent lues (true = présent, false = absent)", () => {
    const reponses = new Map<string, unknown>([
      ["c1-1", true],
      ["c1-2", true],
      ["c1-3", true],
      ["c1-4", true],
      ["c2-1", true],
      ["c2-2", false],
    ]);
    const r = calculerScore(grille("Essentiel"), reponses);
    expect(r.scoreGlobal).toBe(50);
    expect(r.criteresNonValides[0].documentsNonValides[0].reponse).toBe("ABSENT");
  });
});
