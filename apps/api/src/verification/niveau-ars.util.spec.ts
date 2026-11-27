import { describe, expect, it } from "vitest";
import { calculerNiveauArs, categorieDeGrille } from "./niveau-ars.util.js";

describe("calculerNiveauArs", () => {
  // Manuel ARS EH, § 2.3.5 « Exemples de classification ».
  it("exemple de l'établissement hospitalier 1 : niveau 2", () => {
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: (80 / 94) * 100, avances: (10 / 15) * 100 })).toBe(2);
  });

  it("exemple de l'établissement hospitalier 2 (3 critères sans objet) : niveau 4", () => {
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: (82 / 91) * 100, avances: (13 / 15) * 100 })).toBe(4);
  });

  it("essentiels sous 100 % : niveau 0, quels que soient les autres résultats", () => {
    expect(calculerNiveauArs({ essentiels: 96, fondamentaux: 100, avances: 100 })).toBe(0);
  });

  it("bornes de l'échelle (tableau 8)", () => {
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: 59.99, avances: 100 })).toBe(1);
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: 60, avances: null })).toBe(2);
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: 89.99, avances: 100 })).toBe(2);
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: 90, avances: 79.99 })).toBe(3);
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: 90, avances: 80 })).toBe(4);
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: 99, avances: 100 })).toBe(4);
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: 100, avances: 100 })).toBe(5);
  });

  it("catégorie non évaluée : niveau qui la requiert non atteint", () => {
    expect(calculerNiveauArs({ essentiels: null, fondamentaux: 100, avances: 100 })).toBeNull();
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: null, avances: 100 })).toBe(1);
    expect(calculerNiveauArs({ essentiels: 100, fondamentaux: 95, avances: null })).toBe(3);
  });
});

describe("categorieDeGrille", () => {
  it("lit la catégorie dans le nom des grilles officielles", () => {
    expect(categorieDeGrille("Grille d'auto-évaluation des critères essentiels des EH")).toBe("ESSENTIEL");
    expect(categorieDeGrille("Grille d'auto-évaluation des critères fondamentaux des ESPC")).toBe("FONDAMENTAL");
    expect(categorieDeGrille("Grille d'auto-évaluation des critères avancés des EH")).toBe("AVANCE");
    expect(categorieDeGrille("Grille EH — placeholder")).toBeNull();
  });
});
