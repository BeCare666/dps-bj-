import type { Colonne, DefinitionFormulaire, Ligne } from "../types.js";

// Rapports mensuels PNLMNT 1 et 2, photos « 10.13.40 » et « 10.13.40 (1) ».

const TRANCHES = [
  ["lt15", "Moins de 15 ans"],
  ["a15_29", "15 à 29 ans"],
  ["a30_44", "30 à 44 ans"],
  ["a45_59", "45 à 59 ans"],
  ["a60p", "60 ans et plus"],
] as const;

const MASCULIN = TRANCHES.map(([id]) => `M_${id}`);
const FEMININ = TRANCHES.map(([id]) => `F_${id}`);

const COLONNES_SEXE_AGE: Colonne[] = [
  ...TRANCHES.map(([id, libelle]) => ({ id: `M_${id}`, entetes: ["Masculin", libelle] })),
  ...TRANCHES.map(([id, libelle]) => ({ id: `F_${id}`, entetes: ["Féminin", libelle] })),
  { id: "total", entetes: ["Total"], somme: [...MASCULIN, ...FEMININ] },
];

function variables(liste: [number, string][]): Ligne[] {
  return liste.map(([ref, libelle]) => ({ id: `v${ref}`, ref: String(ref), libelle }));
}

function section(id: string, libelle: string): Ligne {
  return { id, libelle, section: true };
}

// Variables 27-28 : une case pour le masculin, une pour le féminin (photo).
const FUSION_PAR_SEXE = [{ colonnes: MASCULIN }, { colonnes: FEMININ }];

const AGES_FEMMES_ENCEINTES = [
  ["a10_14", "10 à 14 ans"],
  ["a15_19", "15 à 19 ans"],
  ["a20_24", "20 à 24 ans"],
  ["a25p", "25 ans et plus"],
] as const;

const COLONNES_FEMMES_ENCEINTES: Colonne[] = [
  ...AGES_FEMMES_ENCEINTES.map(([id, libelle]) => ({ id, entetes: [libelle] })),
  { id: "total", entetes: ["Total"], somme: AGES_FEMMES_ENCEINTES.map(([id]) => id) },
];

export const PNLMNT1: DefinitionFormulaire = {
  code: "PNLMNT1",
  version: "PNLMNT 1",
  titre: "Rapport mensuel PNLMNT 1",
  emetteur: [
    "Ministère de la Santé",
    "Programme National de Lutte contre les MNT",
    "Support de collecte de données pour le suivi des indicateurs de lutte contre les MNT",
  ],
  periodicite: "MENSUELLE",
  entete: ["departement", "zoneSanitaire", "commune", "arrondissement", "formationSanitaire"],
  blocs: [
    {
      type: "tableau",
      id: "mnt",
      enteteLibelle: "Variables",
      avecRef: true,
      colonnes: COLONNES_SEXE_AGE,
      lignes: [
        section("depistage", "Dépistage MNT"),
        ...variables([
          [1, "Nombre de personnes chez qui une glycémie a été réalisée"],
          [2, "Nombre de nouveaux cas de diabète dépistés (taux de glycémie > 1,26 g/l)"],
          [3, "Nombre de personnes chez qui la pression artérielle a été prise"],
          [4, "Nombre de nouveaux cas d'HTA dépistés: TA >140/90 mmHg"],
          [5, "Nombre de nouveaux cas d'Asthme dépistés"],
          [6, "Nombre de nouveaux cas de Broncho Pneumopathie Chronique Obstructive (BPCO) dépistés"],
          [7, "Nombre de nouveaux cas de Cancer suspectés"],
        ]),
        section("complications", "Autres maladies et complications des MNT"),
        ...variables([
          [8, "Nombre de cas d'AVC diagnostiqués"],
          [9, "Nombre de cas de Syndrôme Coronarien Aigue (SCA) diagnostiqués"],
          [10, "Nombre de cas d'insuffisance cardiaque diagnostiqués"],
          [11, "Nombre de cas d'insuffisance rénale chronique diagnostiqués"],
          [12, "Nombre de nouveaux cas de rétinopathies diabétiques diagnostiqués"],
          [13, "Nombre de nouveaux cas de pieds diabétiques diagnostiqués"],
          [14, "Nombre de nouveaux cas d'arthrose diagnostiqués"],
        ]),
        section("prise_en_charge", "Prise en charge des MNT"),
        ...variables([
          [15, "Nombre de personnes nouvellement mises sous Anti-Diabétique Oral (ADO)"],
          [16, "Nombre de personnes nouvellement mises sous insuline"],
          [17, "Nombre personnes nouvellement mises sous médicaments anti-hypertenseur"],
          [18, "Nombre de personnes en suivi pour HTA"],
          [19, "Nombre de personnes en suivi pour Diabète"],
          [20, "Nombre de personnes en suivi pour asthme"],
          [21, "Nombre de personnes en suivi pour arthrose"],
          [22, "Nombre de décès lié au diabète"],
          [23, "Nombre de décès lié à l'HTA"],
          [24, "Nombre de personnes hypertendues perdues de vue*"],
          [25, "Nombre de personnes diabétiques perdues de vue*"],
          [26, "Nombre de sujets atteints d'une MNT référés"],
        ]),
        { ...variables([[27, "Nombre d'agents qualifiés formés sur le WHOPEN en poste au dispensaire"]])[0], fusions: FUSION_PAR_SEXE },
        { ...variables([[28, "Nombre de pairs ou d'agents communautaires intervenant sur le site"]])[0], fusions: FUSION_PAR_SEXE },
      ],
    },
    {
      type: "tableau",
      id: "femmes_enceintes",
      titre: "MNT chez les femmes enceintes",
      enteteLibelle: "Variables",
      avecRef: true,
      colonnes: COLONNES_FEMMES_ENCEINTES,
      lignes: [
        ...variables([
          [29, "Nombre total de femmes enceintes chez qui la pression artérielle a été prise"],
          [30, "Nombre de femmes enceintes dépistées hypertendues"],
          [31, "Nombre de femmes enceintes chez qui une glycémie a été réalisée"],
          [32, "Nombre de femmes enceintes dépistées diabétiques"],
          [33, "Nombre de cas de diabète gestationnel"],
          [34, "Nombre de gestantes hypertendues mises sous traitement"],
          [35, "Nombre de gestantes diabétiques mises sous traitement"],
          [36, "Nombre de cas de pré-éclampsie diagnostiqués"],
        ]),
        // Variable 37 : une seule case sur la photo.
        {
          ...variables([[37, "Nombre de prestataires formés au whopen présentes à la maternité"]])[0],
          fusions: [{ colonnes: AGES_FEMMES_ENCEINTES.map(([id]) => id) }],
        },
      ],
    },
    {
      type: "champs",
      id: "signataires",
      champs: [{ id: "agent_collecte", libelle: "Nom de l'agent de collecte", nature: "texte" }],
    },
  ],
  notes: ["*ADO = Anti-Diabétique Oral", "* Perdu de vue : définition imprimée en bas du formulaire papier"],
};

export const PNLMNT2: DefinitionFormulaire = {
  code: "PNLMNT2",
  version: "PNLMNT 2",
  titre: "Rapport mensuel PNLMNT 2",
  emetteur: PNLMNT1.emetteur,
  periodicite: "MENSUELLE",
  entete: PNLMNT1.entete,
  blocs: [
    {
      type: "tableau",
      id: "mnt",
      enteteLibelle: "Variables",
      avecRef: true,
      colonnes: COLONNES_SEXE_AGE,
      lignes: [
        section("cecite", "Cécité"),
        ...variables([
          [38, "Nombre de nouveau cas de Catarates dépistées"],
          [39, "Nombre de nouveau cas de Catarates opérées"],
          [40, "Nombre de nouveau cas de Glaucome dépistés"],
          [41, "Nombre de nouveau cas de Glaucomes sous traitement"],
          [42, "Nombre de nouveau cas de conjonctivites dépistées"],
        ]),
        // Variable 43 : seule la première case est ouverte, le reste est hachuré (photo).
        {
          ...variables([[43, "Nombre de nouveau cas de conjonctivites Néonatales dépistées"]])[0],
          hachures: [...MASCULIN.slice(1), ...FEMININ],
        },
        ...variables([
          [44, "Nombre de nouveau cas de Vices de réfractions dépistées"],
        ]),
        section("sante_mentale", "Santé mentale"),
        ...variables([
          [45, "Nombre total de nouveaux consultants pour la santé mentale"],
          [46, "Nombre de nouveaux cas de psychose puerpérale"],
          [47, "Nombre de cas de 1er épisode délirant simple"],
          [48, "Nombre de nouveaux cas de schizophrénie"],
          [49, "Nombre de cas de troubles bipolaires"],
          [50, "Nombre de cas de dépression simple"],
          [51, "Nombre de cas de retard mental"],
          [52, "Nombre de cas de Toxicomanie ( Alcool, autres drogues)"],
          [53, "Nombre de cas de rechutes d'affection de santé mentale"],
        ]),
        section("avp", "Accidents de la voie publique"),
        ...variables([
          [54, "Nombre de nouveaux cas d'AVP enregistrés"],
          [55, "Nombre de nouveaux cas d'AVP reçus, transportés par moto"],
          [56, "Nombre de nouveaux cas d'AVP reçus, transportés par un véhicule 4 roues"],
          [57, "Nombre de cas d'AVP atteints d'un traumatisme grave (≥ 6 jours d'hospitalisation ou référés)"],
          [58, "Nombre de cas d'AVP atteints d'un traumatisme léger (< 6 jours d'hospitalisation)"],
          [59, "Nombre de victimes d'AVP sorties guéris"],
          [60, "Nombre de victimes d'AVP sorties avec séquelles"],
          [61, "Nombre de victimes d'AVP décédées"],
          [62, "Nombre de victimes d'AVP référées au niveau supérieur"],
        ]),
      ],
    },
    {
      type: "champs",
      id: "signataires",
      champs: [{ id: "agent_collecte", libelle: "Nom de l'agent de collecte", nature: "texte" }],
    },
  ],
  notes: [],
};
