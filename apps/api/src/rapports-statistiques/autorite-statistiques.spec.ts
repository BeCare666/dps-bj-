import { describe, expect, it } from "vitest";
import {
  FORMULAIRES_STATISTIQUES,
  formulaireStatistique,
  indicateursFormulaire,
  periodesEntre,
  valeurIndicateur,
  type DefinitionFormulaire,
} from "@dps/shared";
import { etablissementDansRessort, liste, moisDe, statistiqueDelai } from "./autorite-statistiques.util.js";

const def = (code: string) => formulaireStatistique(code) as DefinitionFormulaire;
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

// ROADMAP_ESPACE_AUTORITES.md, étape 3 — fonctions pures des tableaux de bord.
describe("Indicateurs des formulaires", () => {
  it("aucune case hachurée, fusionnée ni ligne de section ; clés uniques", () => {
    for (const f of FORMULAIRES_STATISTIQUES) {
      const liste = indicateursFormulaire(f);
      expect(new Set(liste.map((i) => i.cle)).size).toBe(liste.length);
      expect(liste.length).toBeGreaterThan(0);
    }
    const bsa = indicateursFormulaire(def("BS_A")).map((i) => i.cle);
    // Paludisme simple : bloc hospitalisés et cas référés hachurés.
    expect(bsa).toContain("affections.a13_cas.nh_total");
    expect(bsa).not.toContain("affections.a13_cas.h_total");
    expect(bsa).not.toContain("affections.a13_cas.cas_referes");
    // Les lignes de total et les colonnes calculées sont des indicateurs.
    expect(bsa).toContain("affections.total_cas.total_general");
    // Champs nombre seulement (pas les observations texte).
    expect(bsa).toContain("consultants.nouveaux");
    expect(bsa).not.toContain("consultants.observations");
    const simr = indicateursFormulaire(def("SIMR_HEBDO")).map((i) => i.cle);
    expect(simr.some((c) => c.startsWith("maladies.simr."))).toBe(false);
    expect(simr).not.toContain("paludisme.p1.sus_total");
    const pnlp1 = indicateursFormulaire(def("PNLP1"));
    expect(pnlp1.find((i) => i.cle === "rupture.cta")?.nature).toBe("oui_non");
    // CTA à la pharmacie : seule la première case fusionnée reste.
    expect(pnlp1.map((i) => i.cle)).toContain("indicateurs.s_cta_pharmacie.st_M");
    expect(pnlp1.map((i) => i.cle)).not.toContain("indicateurs.s_cta_pharmacie.st_F");
  });

  it("valeur d'une case saisie, calculée, Oui/Non et case vide", () => {
    const f = def("PNLP1");
    // Chiffres de la photo PNLP1 : cas testés à la GE 01 + 37 = 38 (M), 01 + 28 = 29 (F), total 67.
    const valeurs = {
      "indicateurs.s_ge.d5_M": 1,
      "indicateurs.s_ge.d5p_M": 37,
      "indicateurs.s_ge.d5_F": 1,
      "indicateurs.s_ge.d5p_F": 28,
      "indicateurs.s_ge.fe": 0,
      "rupture.cta": true,
    };
    expect(valeurIndicateur(f, "indicateurs.s_ge.d5p_M", valeurs)).toBe(37);
    expect(valeurIndicateur(f, "indicateurs.s_ge.st_M", valeurs)).toBe(38);
    expect(valeurIndicateur(f, "indicateurs.s_ge.st_F", valeurs)).toBe(29);
    expect(valeurIndicateur(f, "indicateurs.s_ge.total", valeurs)).toBe(67);
    expect(valeurIndicateur(f, "rupture.cta", valeurs)).toBe(true);
    expect(valeurIndicateur(f, "rupture.sp", valeurs)).toBeNull();
    expect(valeurIndicateur(f, "indicateurs.s_tdr.d5_M", valeurs)).toBeNull();
    expect(valeurIndicateur(f, "inconnu.x.y", valeurs)).toBeNull();
  });

  it("périodes entre deux dates : mois et semaines ISO", () => {
    expect(periodesEntre("MENSUELLE", d("2026-01-01"), d("2026-03-31"))).toEqual(["2026-01", "2026-02", "2026-03"]);
    // Début en cours de mois : le mois commencé avant « du » est exclu.
    expect(periodesEntre("MENSUELLE", d("2026-01-15"), d("2026-03-01"))).toEqual(["2026-02", "2026-03"]);
    // Semaine 11 de 2026 : du lundi 09/03 au dimanche 15/03 (formulaire 12_BJ).
    expect(periodesEntre("HEBDOMADAIRE", d("2026-03-09"), d("2026-03-22"))).toEqual(["2026-S11", "2026-S12"]);
    expect(periodesEntre("HEBDOMADAIRE", d("2026-03-10"), d("2026-03-22"))).toEqual(["2026-S12"]);
    // Passage d'année : 2026 compte 53 semaines ISO.
    expect(periodesEntre("HEBDOMADAIRE", d("2026-12-21"), d("2027-01-04"))).toEqual(["2026-S52", "2026-S53", "2027-S01"]);
    expect(periodesEntre("MENSUELLE", d("2026-05-01"), d("2026-04-01"))).toEqual([]);
  });
});

describe("Utilitaires des tableaux de bord", () => {
  it("délais : nombre, moyenne et médiane", () => {
    expect(statistiqueDelai([])).toEqual({ n: 0, moyenne: null, mediane: null });
    expect(statistiqueDelai([3, 1, 2])).toEqual({ n: 3, moyenne: 2, mediane: 2 });
    expect(statistiqueDelai([1, 2, 3, 10])).toEqual({ n: 4, moyenne: 4, mediane: 2.5 });
  });

  it("ressort d'un établissement selon sa localisation", () => {
    const zs = { niveau: "ZONE_SANITAIRE" as const, departement: "OUEME", zoneSanitaireCle: "pas" };
    expect(etablissementDansRessort(zs, { departement: "OUEME", zoneSanitaire: "PAS" })).toBe(true);
    expect(etablissementDansRessort(zs, { departement: "OUEME", zoneSanitaire: " p.a.s " })).toBe(false);
    expect(etablissementDansRessort(zs, { departement: "OUEME", zoneSanitaire: "Pas" })).toBe(true);
    expect(etablissementDansRessort(zs, { departement: "OUEME", zoneSanitaire: "AAKA" })).toBe(false);
    expect(etablissementDansRessort(zs, { departement: "LITTORAL", zoneSanitaire: "PAS" })).toBe(false);
    expect(etablissementDansRessort(zs, { departement: null, zoneSanitaire: null })).toBe(false);
    const dds = { niveau: "DEPARTEMENT" as const, departement: "OUEME", zoneSanitaireCle: null };
    expect(etablissementDansRessort(dds, { departement: "OUEME", zoneSanitaire: "AAKA" })).toBe(true);
    expect(etablissementDansRessort(dds, { departement: "ZOU", zoneSanitaire: null })).toBe(false);
    const sansDep = { niveau: "DEPARTEMENT" as const, departement: null, zoneSanitaireCle: null };
    expect(etablissementDansRessort(sansDep, { departement: null, zoneSanitaire: null })).toBe(false);
    const nat = { niveau: "NATIONAL" as const, departement: null, zoneSanitaireCle: null };
    expect(etablissementDansRessort(nat, { departement: null, zoneSanitaire: null })).toBe(true);
  });

  it("listes séparées par des virgules et mois d'une date", () => {
    expect(liste(undefined)).toEqual([]);
    expect(liste(" a, ,b ,")).toEqual(["a", "b"]);
    expect(moisDe(new Date("2026-03-31T23:30:00.000Z"))).toBe("2026-03");
  });
});
