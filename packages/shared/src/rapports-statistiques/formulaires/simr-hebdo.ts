import type { Colonne, DefinitionFormulaire, Ligne } from "../types.js";

// 12_BJ Rapport hebdomadaire des maladies ou événements sous surveillance,
// V14.11.2025, photo « 10.13.40 (2) ».

function groupe(prefixe: string, titre: string): Colonne[] {
  const detail: Colonne[] = [
    { id: `${prefixe}_m5_M`, entetes: [titre, "<5ans", "M"] },
    { id: `${prefixe}_m5_F`, entetes: [titre, "<5ans", "F"] },
    { id: `${prefixe}_p5_M`, entetes: [titre, "≥5ans", "M"] },
    { id: `${prefixe}_p5_F`, entetes: [titre, "≥5ans", "F"] },
  ];
  return [...detail, { id: `${prefixe}_total`, entetes: [titre, "Total"], somme: detail.map((c) => c.id) }];
}

const SUSPECT = groupe("sus", "Suspect");
const COLONNES: Colonne[] = [...SUSPECT, ...groupe("dec", "Décès"), ...groupe("conf", "Confirmé")];

const MALADIES = [
  "Choléra",
  "Méningite",
  "Fièvre jaune",
  "Tétanos néonatal",
  "PFA",
  "Rougeole",
  "Shigellose",
  "Rage",
  "Charbon bactéridien",
  "Intoxication alimentaire",
  "Fièvre Lassa",
  "Fièvre Ebola",
  "Dengue",
  "Fièvre Marburg",
  "Chikungunya",
  "Zika",
  "Grippe (*IAHP_HxNy)",
  "Ver de Guinée",
  "Peste",
  "Fièvre typhoïde",
  "Mpox",
  "COVID-19",
  "Morsure de chien",
  "MAPI ou Effets Indésirable",
  "Hépatites",
  "Asthme",
  "HTA",
  "Noma",
  "Varicelle",
  "Diphtérie",
  "Gale",
  "Bilharziose urinaire",
  "Envenimation",
];

const LIGNES_MALADIES: Ligne[] = [
  { id: "simr", libelle: "Situation de la SIMR", section: true },
  ...MALADIES.map((libelle, i) => ({ id: `m${i + 1}`, libelle })),
  { id: "autres", libelle: "Autres :", precision: true },
];

const NOMBRE: Colonne[] = [{ id: "nombre", entetes: ["Nombre"] }];

// Situation du paludisme : colonnes « Suspect » grisées sur la photo.
const HACHURES_SUSPECT = SUSPECT.map((c) => c.id);

const LIGNES_PALUDISME: Ligne[] = [
  "Paludisme simple testé TDR (+)",
  "Paludisme simple testé GE (+)",
  "Paludisme grave testé TDR (+)",
  "Paludisme grave testé GE (+)",
  "P. simple femme enceinte TDR ou GE (+)",
  "P. grave femme enceinte TDR ou GE (+)",
].map((libelle, i) => ({ id: `p${i + 1}`, libelle, hachures: HACHURES_SUSPECT }));

export const SIMR_HEBDO: DefinitionFormulaire = {
  code: "SIMR_HEBDO",
  version: "V14.11.2025",
  titre: "Rapport hebdomadaire des maladies ou événements sous surveillance",
  emetteur: ["République du Bénin", "Ministère de la Santé", "12_BJ"],
  periodicite: "HEBDOMADAIRE",
  entete: ["departement", "zoneSanitaire", "commune", "formationSanitaire"],
  blocs: [
    { type: "tableau", id: "maladies", enteteLibelle: "Maladies/Evénements", colonnes: COLONNES, lignes: LIGNES_MALADIES },
    {
      type: "tableau",
      id: "deces",
      enteteLibelle: "Situation des décès",
      colonnes: NOMBRE,
      lignes: [
        { id: "maternel", libelle: "Décès maternel" },
        { id: "near_miss", libelle: "Near miss" },
        { id: "neonatal", libelle: "Décès néonatal (0 à 28 jours)" },
        { id: "infantile", libelle: "Décès infantile (<1an avec DNN)" },
        { id: "infanto_juvenile", libelle: "Décès infanto-juvénile (0-5ans)" },
        { id: "plus5", libelle: "Décès ≥ 5 ans" },
      ],
    },
    {
      type: "tableau",
      id: "flambees",
      enteteLibelle: "Situation des flambées",
      colonnes: NOMBRE,
      lignes: [
        { id: "suspicion", libelle: "Nouvelle suspicion de flambée" },
        { id: "investiguee", libelle: "Nouvelle flambée investiguée" },
        { id: "confirmee", libelle: "Nouvelle épidémie confirmée" },
        { id: "riposte", libelle: "Nouvelle épidémie avec riposte" },
      ],
    },
    { type: "tableau", id: "paludisme", enteteLibelle: "Situation du paludisme", colonnes: COLONNES, lignes: LIGNES_PALUDISME },
  ],
  notes: [],
};
