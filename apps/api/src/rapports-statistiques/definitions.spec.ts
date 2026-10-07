import {
  FORMULAIRES_STATISTIQUES,
  bornesPeriode,
  erreursDefinition,
  erreursValeurs,
  formulaireStatistique,
  libellePeriode,
  natureCase,
  periodeDeDate,
  periodeValide,
  saisiesManquantes,
  valeurCase,
  type BlocTableau,
  type DefinitionFormulaire,
  type ValeursRapport,
} from "@dps/shared";

function tableau(def: DefinitionFormulaire, id: string): BlocTableau {
  const bloc = def.blocs.find((b) => b.id === id);
  if (!bloc || bloc.type !== "tableau") throw new Error(`tableau ${id} absent`);
  return bloc;
}

function valeur(def: DefinitionFormulaire, blocId: string, ligneId: string, colonneId: string, valeurs: ValeursRapport) {
  const bloc = tableau(def, blocId);
  const l = bloc.lignes.find((x) => x.id === ligneId)!;
  const c = bloc.colonnes.find((x) => x.id === colonneId)!;
  return valeurCase(bloc, l, c, valeurs);
}

function nature(def: DefinitionFormulaire, blocId: string, ligneId: string, colonneId: string) {
  const bloc = tableau(def, blocId);
  return natureCase(bloc, bloc.lignes.find((x) => x.id === ligneId)!, bloc.colonnes.find((x) => x.id === colonneId)!);
}

const def = (code: string) => formulaireStatistique(code)!;

describe("définitions des formulaires statistiques", () => {
  it("6 formulaires, codes uniques, définitions cohérentes", () => {
    expect(FORMULAIRES_STATISTIQUES.map((f) => f.code)).toEqual([
      "BS_A",
      "PNLP1",
      "PNLMNT1",
      "PNLMNT2",
      "SIMR_HEBDO",
      "TRANSFUSION",
    ]);
    for (const f of FORMULAIRES_STATISTIQUES) expect(erreursDefinition(f)).toEqual([]);
  });

  describe("BS-a", () => {
    const bs = def("BS_A");

    it("46 affections ; lignes 13 et 14 sans « Décès »", () => {
      const ids = tableau(bs, "affections").lignes.map((l) => l.id);
      expect(ids.filter((id) => id.endsWith("_cas") && /^a\d+_/.test(id))).toHaveLength(46);
      expect(ids).not.toContain("a13_deces");
      expect(ids).not.toContain("a14_deces");
      expect(ids).toContain("a15_deces");
    });

    it("paludisme simple : hospitalisés et cas référés hachurés, total général = non hospitalisés", () => {
      expect(nature(bs, "affections", "a13_cas", "h_lt1m_M")).toBe("hachuree");
      expect(nature(bs, "affections", "a13_cas", "cas_referes")).toBe("hachuree");
      expect(nature(bs, "affections", "a13_cas", "nh_a25p_F")).toBe("saisie");
      const v: ValeursRapport = { "affections.a14_cas.nh_a25p_M": 11, "affections.a14_cas.nh_a25p_F": 8 };
      expect(valeur(bs, "affections", "a14_cas", "nh_total", v)).toBe(19);
      expect(valeur(bs, "affections", "a14_cas", "total_general", v)).toBe(19);
    });

    it("total à reporter, report et total général du relevé", () => {
      const v: ValeursRapport = {
        "affections.a1_cas.nh_lt1m_M": 2,
        "affections.a24_cas.h_a25p_F": 3,
        "affections.a25_cas.nh_a5_9_F": 4,
        "affections.a46_deces.nh_a25p_M": 1,
      };
      expect(valeur(bs, "affections", "total_a_reporter_cas", "total_general", v)).toBe(5);
      expect(valeur(bs, "affections", "report_cas", "nh_lt1m_M", v)).toBe(2);
      expect(valeur(bs, "affections", "total_cas", "total_general", v)).toBe(9);
      expect(valeur(bs, "affections", "total_deces", "total_general", v)).toBe(1);
      expect(nature(bs, "affections", "total_cas", "cas_referes")).toBe("calculee");
    });
  });

  describe("PNLP1", () => {
    const p = def("PNLP1");

    it("sous-totaux et total : chiffres de la photo (cas testés à la GE)", () => {
      const v: ValeursRapport = {
        "indicateurs.s_ge.d5_M": 1,
        "indicateurs.s_ge.d5_F": 1,
        "indicateurs.s_ge.d5p_M": 37,
        "indicateurs.s_ge.d5p_F": 28,
        "indicateurs.s_ge.fe": 0,
      };
      expect(valeur(p, "indicateurs", "s_ge", "st_M", v)).toBe(38);
      expect(valeur(p, "indicateurs", "s_ge", "st_F", v)).toBe(29);
      expect(valeur(p, "indicateurs", "s_ge", "total", v)).toBe(67);
    });

    it("CTA à la pharmacie : une seule case (sous-total fusionné), reprise au total", () => {
      expect(nature(p, "indicateurs", "s_cta_pharmacie", "d5_M")).toBe("hachuree");
      expect(nature(p, "indicateurs", "s_cta_pharmacie", "st_M")).toBe("saisie");
      expect(nature(p, "indicateurs", "s_cta_pharmacie", "st_F")).toBe("fusionnee");
      expect(valeur(p, "indicateurs", "s_cta_pharmacie", "total", { "indicateurs.s_cta_pharmacie.st_M": 7 })).toBe(7);
    });

    it("sections sans case", () => {
      expect(nature(p, "indicateurs", "simple", "d5_M")).toBe("hachuree");
    });
  });

  describe("PNLMNT", () => {
    it("variables 27-28 : une case masculin, une case féminin", () => {
      const m = def("PNLMNT1");
      expect(nature(m, "mnt", "v27", "M_lt15")).toBe("saisie");
      expect(nature(m, "mnt", "v27", "M_a15_29")).toBe("fusionnee");
      expect(valeur(m, "mnt", "v27", "total", { "mnt.v27.M_lt15": 2, "mnt.v27.F_lt15": 3 })).toBe(5);
    });

    it("variable 37 : une seule case", () => {
      const m = def("PNLMNT1");
      expect(nature(m, "femmes_enceintes", "v37", "a10_14")).toBe("saisie");
      expect(nature(m, "femmes_enceintes", "v37", "a25p")).toBe("fusionnee");
    });

    it("variable 43 : seule la première case est ouverte", () => {
      const m = def("PNLMNT2");
      expect(nature(m, "mnt", "v43", "M_lt15")).toBe("saisie");
      expect(nature(m, "mnt", "v43", "M_a15_29")).toBe("hachuree");
      expect(nature(m, "mnt", "v43", "F_lt15")).toBe("hachuree");
      expect(valeur(m, "mnt", "v43", "total", { "mnt.v43.M_lt15": 4 })).toBe(4);
    });
  });

  it("12_BJ : colonnes « Suspect » hachurées pour le paludisme, total compris", () => {
    const s = def("SIMR_HEBDO");
    expect(nature(s, "paludisme", "p1", "sus_total")).toBe("hachuree");
    expect(nature(s, "paludisme", "p1", "conf_m5_M")).toBe("saisie");
    expect(nature(s, "maladies", "m1", "sus_total")).toBe("calculee");
  });

  it("transfusion : le taux de satisfaction n'est pas additionné dans le TOTAL", () => {
    const t = def("TRANSFUSION");
    expect(nature(t, "attribution", "total", "taux")).toBe("saisie");
    expect(nature(t, "attribution", "total", "demandee")).toBe("calculee");
    const v: ValeursRapport = { "receveurs.masculin.a1_4": 2, "receveurs.feminin.plus60": 3 };
    expect(valeur(t, "receveurs", "total", "total", v)).toBe(5);
  });
});

describe("validation des valeurs", () => {
  const p = def("PNLP1");

  it("refuse une case inconnue, calculée ou hachurée", () => {
    expect(erreursValeurs(p, { "indicateurs.s_ge.inconnue": 1 })).toHaveLength(1);
    expect(erreursValeurs(p, { "indicateurs.s_ge.total": 1 })).toHaveLength(1);
    expect(erreursValeurs(p, { "indicateurs.s_cta_pharmacie.d5_M": 1 })).toHaveLength(1);
  });

  it("refuse un entier négatif ou décimal, accepte un taux décimal", () => {
    expect(erreursValeurs(p, { "indicateurs.s_ge.d5_M": -1 })).toHaveLength(1);
    expect(erreursValeurs(p, { "indicateurs.s_ge.d5_M": 1.5 })).toHaveLength(1);
    expect(erreursValeurs(p, { "indicateurs.s_ge.d5_M": "3" })).toHaveLength(1);
    expect(erreursValeurs(def("TRANSFUSION"), { "attribution.cgr.taux": 87.5 })).toEqual([]);
  });

  it("oui/non attendu pour les ruptures de stock", () => {
    expect(erreursValeurs(p, { "rupture.cta": true })).toEqual([]);
    expect(erreursValeurs(p, { "rupture.cta": "oui" })).toHaveLength(1);
  });

  it("cases numériques et oui/non obligatoires à la soumission, textes facultatifs", () => {
    const manquantes = saisiesManquantes(p, {});
    expect(manquantes).toContain("indicateurs.s_ge.d5_M");
    expect(manquantes).toContain("indicateurs.s_cta_pharmacie.st_M");
    expect(manquantes).toContain("rupture.miild");
    expect(manquantes).not.toContain("signataires.statisticien");
    expect(manquantes).not.toContain("indicateurs.s_ge.total");
  });
});

describe("périodes", () => {
  it("semaine ISO : semaine 11 de 2026 = du 09/03/2026 au 15/03/2026 (photo 12_BJ)", () => {
    const b = bornesPeriode("HEBDOMADAIRE", "2026-S11")!;
    expect(b.debut.toISOString().slice(0, 10)).toBe("2026-03-09");
    expect(b.fin.toISOString().slice(0, 10)).toBe("2026-03-15");
    expect(libellePeriode("HEBDOMADAIRE", "2026-S11")).toBe("semaine 11 du 09/03/2026 au 15/03/2026");
    expect(periodeDeDate("HEBDOMADAIRE", new Date(Date.UTC(2026, 2, 15)))).toBe("2026-S11");
  });

  it("semaines en bord d'année", () => {
    expect(periodeDeDate("HEBDOMADAIRE", new Date(Date.UTC(2025, 11, 29)))).toBe("2026-S01");
    // 2025 commence un mercredi (52 semaines) ; 2026 un jeudi (53 semaines).
    expect(periodeValide("HEBDOMADAIRE", "2025-S53")).toBe(false);
    expect(periodeValide("HEBDOMADAIRE", "2026-S53")).toBe(true);
  });

  it("mois", () => {
    expect(libellePeriode("MENSUELLE", "2026-04")).toBe("avril 2026");
    expect(periodeValide("MENSUELLE", "2026-13")).toBe(false);
    expect(periodeDeDate("MENSUELLE", new Date(Date.UTC(2026, 3, 30)))).toBe("2026-04");
  });
});
