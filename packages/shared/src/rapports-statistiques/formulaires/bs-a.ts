import type { Colonne, DefinitionFormulaire, Ligne } from "../types.js";

// Relevé épidémiologique mensuel des centres de santé (BS-a), photos
// « 10.11.15 (2) » (page 1) et « 10.11.15 (3) » (page 2).

const AGES = [
  ["lt1m", "< 1 mois"],
  ["m1_11", "1-11 mois"],
  ["a1_4", "1-4 ans"],
  ["a5_9", "5-9 ans"],
  ["a10_14", "10-14 ans"],
  ["a15_19", "15-19 ans"],
  ["a20_24", "20-24 ans"],
  ["a25p", "25 ans et plus"],
] as const;

function blocConsultants(prefixe: string, titre: string): Colonne[] {
  const detail: Colonne[] = AGES.flatMap(([id, libelle]) => [
    { id: `${prefixe}_${id}_M`, entetes: [titre, libelle, "M"] },
    { id: `${prefixe}_${id}_F`, entetes: [titre, libelle, "F"] },
  ]);
  return [...detail, { id: `${prefixe}_total`, entetes: [titre, "Total"], somme: detail.map((c) => c.id) }];
}

const NON_HOSPITALISES = blocConsultants("nh", "Consultants non hospitalisés");
const HOSPITALISES = blocConsultants("h", "Consultants hospitalisés (*)");

const COLONNES: Colonne[] = [
  ...NON_HOSPITALISES,
  ...HOSPITALISES,
  { id: "total_general", entetes: ["Total général"], somme: ["nh_total", "h_total"] },
  { id: "cas_referes", entetes: ["Cas référés"] },
];

// Lignes 13 et 14 (paludisme simple) : case « Cas » seule, bloc hospitalisés
// et « Cas référés » hachurés (lisible sur la photo de la page 1).
const HACHURES_PALUDISME_SIMPLE = [...HOSPITALISES.map((c) => c.id), "cas_referes"];

// [numéro, libellé imprimé, « Cas » seulement]
const AFFECTIONS: [number, string, boolean?][] = [
  [1, "Rougeole (1)"],
  [2, "Autres affections dermatologiques"],
  [3, "Paralysie flasque aigüe (1)"],
  [4, "Coqueluche"],
  [5, "Tétanos maternel et néo-natal (1)"],
  [6, "Autres tétanos"],
  [7, "Méningite (1)"],
  [8, "Fièvre jaune (1)"],
  [9, "Choléra (1)"],
  [10, "Diarrhée fébrile"],
  [11, "Diarrhée avec déshydratation"],
  [12, "Autres affections gastro-intestinales"],
  [13, "Paludisme simple non confirmé", true],
  [14, "Paludisme simple confirmé", true],
  [15, "Paludisme grave"],
  [16, "Écoulement urétral"],
  [17, "Perte vaginale"],
  [18, "Ulcères génitaux"],
  [19, "Douleurs abdominales basses"],
  [20, "Autres IST"],
  [21, "Conjonctivite"],
  [22, "Autres affections oculaires"],
  [23, "Malnutrition"],
  [24, "Autres affections uro-génitales"],
  [25, "Anémie"],
  [26, "Toux chronique"],
  [27, "Infections respiratoires aigües/hautes"],
  [28, "Infections respiratoires aigües/basses"],
  [29, "Autres affections respiratoires"],
  [30, "Rage déclarée (1)"],
  [31, "Traumatisme dû aux accidents de la circulation"],
  [32, "Autres traumatismes"],
  [33, "Hypertension artérielle"],
  [34, "Affections cardio-vasculaires"],
  [35, "Affections ostéo-articulaires"],
  [36, "Affections bucco-dentaires"],
  [37, "Shigellose (1)"],
  [38, "Dracunculose (1)"],
  [39, "Diabète"],
  [40, "Morsure de chien"],
  [41, "Morsure de serpent"],
  [42, "Fièvre Hémorragique Virale (1)"],
  [43, "Dengue (1)"],
  [44, "Gale"],
  [45, "Asthme"],
  [46, "Autres affections"],
];

function lignesAffection([numero, libelle, casSeulement]: [number, string, boolean?]): Ligne[] {
  const titre = `${numero}- ${libelle}`;
  const cas: Ligne = { id: `a${numero}_cas`, libelle: titre, sousLibelle: "Cas" };
  if (casSeulement) return [{ ...cas, hachures: HACHURES_PALUDISME_SIMPLE }];
  return [cas, { id: `a${numero}_deces`, libelle: titre, sousLibelle: "Décès" }];
}

const PAGE_1 = AFFECTIONS.filter(([n]) => n <= 24);
const PAGE_2 = AFFECTIONS.filter(([n]) => n >= 25);

const idsCas = (liste: typeof AFFECTIONS) => liste.map(([n]) => `a${n}_cas`);
const idsDeces = (liste: typeof AFFECTIONS) => liste.filter(([, , casSeul]) => !casSeul).map(([n]) => `a${n}_deces`);

const LIGNES: Ligne[] = [
  ...PAGE_1.flatMap(lignesAffection),
  { id: "total_a_reporter_cas", libelle: "TOTAL À REPORTER", sousLibelle: "Cas", somme: idsCas(PAGE_1) },
  { id: "total_a_reporter_deces", libelle: "TOTAL À REPORTER", sousLibelle: "Décès", somme: idsDeces(PAGE_1) },
  { id: "report_cas", libelle: "REPORT", sousLibelle: "Cas", somme: ["total_a_reporter_cas"] },
  { id: "report_deces", libelle: "REPORT", sousLibelle: "Décès", somme: ["total_a_reporter_deces"] },
  ...PAGE_2.flatMap(lignesAffection),
  { id: "total_cas", libelle: "TOTAL", sousLibelle: "Cas", somme: ["report_cas", ...idsCas(PAGE_2)] },
  { id: "total_deces", libelle: "TOTAL", sousLibelle: "Décès", somme: ["report_deces", ...idsDeces(PAGE_2)] },
];

export const BS_A: DefinitionFormulaire = {
  code: "BS_A",
  version: "BS-a",
  titre: "Relevé épidémiologique mensuel des centres de santé",
  emetteur: ["République du Bénin", "Ministère de la Santé"],
  periodicite: "MENSUELLE",
  entete: ["departement", "formationSanitaire", "zoneSanitaire"],
  blocs: [
    { type: "tableau", id: "affections", enteteLibelle: "Affections", colonnes: COLONNES, lignes: LIGNES },
    {
      type: "champs",
      id: "consultants",
      champs: [
        { id: "nouveaux", libelle: "Nouveaux consultants", nature: "nombre" },
        { id: "anciens", libelle: "Anciens consultants", nature: "nombre" },
        { id: "observations", libelle: "Observations", nature: "texte_long" },
      ],
    },
  ],
  notes: [
    "(1) déclaration obligatoire hebdomadaire",
    "(*) concerne uniquement les Centres de Santé disposant de médecins et qui hospitalisent",
    "Ne rien inscrire dans les parties hachurées",
  ],
};
