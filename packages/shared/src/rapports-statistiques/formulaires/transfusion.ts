import type { Colonne, DefinitionFormulaire, Ligne } from "../types.js";

// Rapport mensuel d'activités d'une structure sanitaire agréée pour l'acte
// transfusionnel, photos « 10.15.40 (1) », « (2) » et « (3) ». Le papier est
// celui de l'Ouémé (DDS-O / STS-O) ; seul le département change (décision
// client) : « {departement} » est remplacé par celui du rapport.

function lignes(liste: [string, string][]): Ligne[] {
  return liste.map(([id, libelle]) => ({ id, libelle }));
}

function avecTotal(liste: Ligne[], libelle = "Total"): Ligne[] {
  return [...liste, { id: "total", libelle, somme: liste.map((l) => l.id) }];
}

const PSL: [string, string][] = [
  ["sang_total", "Sang Total"],
  ["cgr", "CGR"],
  ["pfc", "PFC"],
  ["cps", "CPS"],
];

const TRANCHES_RECEVEURS: Colonne[] = [
  { id: "m0_11", entetes: ["0 à 11 mois"] },
  { id: "a1_4", entetes: ["1 à 4 ans"] },
  { id: "a5_14", entetes: ["5 à 14 ans"] },
  { id: "a15_44", entetes: ["15 à 44 ans"] },
  { id: "a45_49", entetes: ["45 à 49 ans"] },
  { id: "a50_60", entetes: ["50 à 60 ans"] },
  { id: "plus60", entetes: [">60 ans"] },
];

export const TRANSFUSION: DefinitionFormulaire = {
  code: "TRANSFUSION",
  version: "STS",
  titre: "Rapport mensuel d'activités — Structure sanitaire agréée pour l'acte transfusionnel",
  emetteur: [
    "Ministère de la Santé",
    "République du Bénin",
    "Direction départementale de la santé — {departement}",
    "Service de la transfusion sanguine — {departement}",
  ],
  periodicite: "MENSUELLE",
  entete: ["departement", "formationSanitaire", "telephone", "email"],
  blocs: [
    {
      type: "tableau",
      id: "attribution",
      titre: "1) Attribution nominative — Tableau général",
      enteteLibelle: "PSL",
      colonnes: [
        { id: "demandee", entetes: ["Quantité demandée"] },
        { id: "servie_bds", entetes: ["Quantité servie BDS"] },
        { id: "servie_ailleurs", entetes: ["Quantité servie Ailleurs"] },
        { id: "taux", entetes: ["Taux de satisfaction"], decimal: true, horsTotal: true },
      ],
      lignes: avecTotal(lignes(PSL), "TOTAL"),
    },
    {
      type: "champs",
      id: "tculm",
      titre: "Test de Contrôle Ultime au Lit du Malade (TCULM)",
      champs: [
        { id: "malades", libelle: "Nombre de malades compatibilisés", nature: "nombre" },
        { id: "tests", libelle: "Nombre de tests réalisés", nature: "nombre" },
        { id: "positifs", libelle: "Nombre de tests positifs", nature: "nombre" },
      ],
    },
    {
      type: "tableau",
      id: "receveurs",
      titre: "Caractéristiques des receveurs selon l'âge et le sexe",
      enteteLibelle: "",
      colonnes: [...TRANCHES_RECEVEURS, { id: "total", entetes: ["Total"], somme: TRANCHES_RECEVEURS.map((c) => c.id) }],
      lignes: avecTotal(lignes([
        ["masculin", "Masculin"],
        ["feminin", "Féminin"],
      ])),
    },
    {
      type: "tableau",
      id: "services",
      titre: "Répartition selon les services utilisateurs",
      enteteLibelle: "Services",
      colonnes: PSL.map(([id, libelle]) => ({ id, entetes: [libelle] })),
      lignes: avecTotal(lignes([
        ["pediatrie", "Pédiatrie"],
        ["gyneco", "Gynéco-obstétrique"],
        ["chirurgie", "Chirurgie"],
        ["medecine", "Médecine"],
        ["reanimation", "Réanimation-Urgences"],
        ["autres", "Autres"],
      ])),
    },
    {
      type: "tableau",
      id: "affections",
      titre: "Répartition selon les affections",
      enteteLibelle: "Affections",
      colonnes: [{ id: "nombre", entetes: ["Nombre"] }],
      lignes: avecTotal(lignes([
        ["anemie_palustre", "Anémie palustre"],
        ["anemie_drepanocytaire", "Anémie drépanocytaire"],
        ["autres_anemies", "Autres cas d'anémie"],
        ["chirurgie", "Intervention chirurgicale (Hémorragie)"],
        ["gyneco", "Complication gynéco-obstétrique (hémorragie)"],
        ["autres_hemorragies", "Autres cas d'hémorragie"],
        ["hemopathie", "Hémopathie"],
      ])),
    },
    {
      type: "tableau",
      id: "eir",
      titre: "2) Effets indésirables receveurs (EIR) — Nombre de patients ayant eu un EIR",
      enteteLibelle: "",
      colonnes: [{ id: "nombre", entetes: ["Nbre"] }],
      lignes: lignes([
        ["choc", "Choc"],
        ["frissons", "Frissons"],
        ["toux", "Toux"],
        ["dyspnee", "Dyspnée"],
        ["bronchospasme", "Bronchospasme"],
        ["oap", "Signes d'OAP"],
        ["autres", "Autres"],
        ["nausees", "Nausées"],
        ["vomissements", "Vomissements"],
        ["diarrhee", "Diarrhée"],
        ["prurit", "Prurit"],
        ["urticaire", "Urticaire"],
        ["erytheme", "Erythème"],
        ["angioedeme", "Angioedème"],
      ]),
    },
    {
      type: "champs",
      id: "fdn",
      titre: "Gestion des FDN",
      champs: [
        { id: "recue_sts", libelle: "FDN reçue au STS (Préciser le Numéro)", nature: "texte" },
        { id: "totale_mois", libelle: "FDN Totale reçue au cours du Mois", nature: "nombre" },
        { id: "restante", libelle: "FDN Restante (Préciser le Numéro)", nature: "texte" },
      ],
    },
    {
      type: "champs",
      id: "observations",
      champs: [
        { id: "non_conformite", libelle: "Non-conformité observée et difficultés rencontrées", nature: "texte_long" },
        { id: "actions", libelle: "Actions immédiates entreprises", nature: "texte_long" },
        { id: "solutions", libelle: "Solutions durables envisagées", nature: "texte_long" },
      ],
    },
  ],
  notes: [],
};
