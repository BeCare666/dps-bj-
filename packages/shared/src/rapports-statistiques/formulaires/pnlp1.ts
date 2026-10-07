import type { Colonne, DefinitionFormulaire, Ligne } from "../types.js";

// Rapport mensuel de surveillance et logistique PNLP1, photos « 10.11.15 (1) »
// et « 10.11.16 ».
//
// Sous-totaux : les sous-titres imprimés sous « Sous-Total » sont illisibles
// sur les photos ([!]). Masculin = (1) + (2) et Féminin = (1) + (2) + (3) :
// c'est la seule répartition qui couvre toutes les colonnes, et elle est
// cohérente avec les chiffres de la photo (ex. cas testés à la GE : 01 + 37 =
// 38, 01 + 28 = 29, total 67).

const COLONNES: Colonne[] = [
  { id: "d5_M", entetes: ["Dispensaire", "Moins de 5 ans (1)", "Masculin"] },
  { id: "d5_F", entetes: ["Dispensaire", "Moins de 5 ans (1)", "Féminin"] },
  { id: "d5p_M", entetes: ["Dispensaire", "5 ans et plus sans les femmes enceintes (2)", "Masculin"] },
  { id: "d5p_F", entetes: ["Dispensaire", "5 ans et plus sans les femmes enceintes (2)", "Féminin"] },
  { id: "fe", entetes: ["Maternité", "Femmes enceintes (3)"] },
  { id: "st_M", entetes: ["Sous-total", "Masculin"], somme: ["d5_M", "d5p_M"] },
  { id: "st_F", entetes: ["Sous-total", "Féminin"], somme: ["d5_F", "d5p_F", "fe"] },
  { id: "total", entetes: ["Total"], somme: ["st_M", "st_F"] },
];

const DETAIL = ["d5_M", "d5_F", "d5p_M", "d5p_F", "fe"];

const LIGNES: Ligne[] = [
  { id: "simple", libelle: "Paludisme simple", section: true },
  { id: "s_clinique", libelle: "Cas de paludisme simple diagnostiqué cliniquement sans test" },
  { id: "s_tdr", libelle: "Cas testés au TDR" },
  { id: "s_ge", libelle: "Cas testés à la GE" },
  { id: "s_tdr_pos", libelle: "Cas testé TDR positif" },
  { id: "s_ge_pos", libelle: "Cas testé GE positif" },
  { id: "s_registre", libelle: "Cas de paludisme simple notifié dans le registre de soins curatifs" },
  { id: "s_cta_prescrit", libelle: "Nombre de cas de paludisme ayant bénéficié de prescription de CTA" },
  {
    id: "s_cta_pharmacie",
    libelle: "Nombre de cas de paludisme ayant eu CTA à la pharmacie du centre",
    hachures: DETAIL,
    fusions: [{ colonnes: ["st_M", "st_F"] }],
  },
  { id: "grave", libelle: "Paludisme grave", section: true },
  { id: "g_clinique", libelle: "Cas de paludisme grave diagnostiqué cliniquement sans test" },
  { id: "g_tdr", libelle: "Cas testés au TDR" },
  { id: "g_ge", libelle: "Cas testé à la GE" },
  { id: "g_tdr_pos", libelle: "Cas testé TDR positif" },
  { id: "g_ge_pos", libelle: "Cas testé GE positif" },
  { id: "g_registre", libelle: "Paludisme grave notifié dans le registre de soins curatifs" },
  { id: "g_deces_teste", libelle: "Décès dus au paludisme grave (testé positif)" },
  { id: "g_deces_clinique", libelle: "Décès dus au paludisme grave diagnostiqué cliniquement sans test" },
];

export const PNLP1: DefinitionFormulaire = {
  code: "PNLP1",
  version: "PNLP1",
  titre: "Rapport mensuel de surveillance et logistique PNLP1",
  emetteur: ["République du Bénin", "Ministère de la Santé", "Programme National de Lutte contre le Paludisme"],
  periodicite: "MENSUELLE",
  entete: ["departement", "zoneSanitaire", "commune", "arrondissement", "formationSanitaire"],
  blocs: [
    { type: "tableau", id: "indicateurs", enteteLibelle: "Indicateurs", colonnes: COLONNES, lignes: LIGNES },
    {
      type: "oui_non",
      id: "rupture",
      titre: "Rupture de stock (d'au moins 1 jour) dans le mois",
      elements: [
        { id: "cta", libelle: "CTA toutes catégories" },
        { id: "miild", libelle: "MIILD" },
        { id: "sp", libelle: "SP" },
        { id: "tdr", libelle: "TDR" },
        { id: "quinine", libelle: "Quinine injectable" },
        { id: "artesunate", libelle: "Artésunate injectable" },
      ],
    },
    {
      type: "champs",
      id: "signataires",
      champs: [{ id: "statisticien", libelle: "Nom et prénom du statisticien", nature: "texte" }],
    },
  ],
  notes: [],
};
