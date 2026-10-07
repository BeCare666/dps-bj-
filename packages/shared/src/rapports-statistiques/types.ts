// Rapports statistiques — description des formulaires papier du ministère de
// la Santé sous forme de données (voir ROADMAP_RAPPORTS_STATISTIQUES.md). Un
// formulaire est rendu, validé et totalisé à partir de cette seule description,
// identique côté API et côté web.

export type Periodicite = "MENSUELLE" | "HEBDOMADAIRE";

// Champs d'en-tête pré-remplis depuis la fiche de l'établissement.
export type CleEntete =
  | "departement"
  | "zoneSanitaire"
  | "commune"
  | "arrondissement"
  | "formationSanitaire"
  | "telephone"
  | "email";

export interface Colonne {
  id: string;
  // Chemin d'en-tête, du niveau le plus haut au plus bas : deux colonnes
  // voisines qui partagent un préfixe sont regroupées sous la même case.
  entetes: string[];
  // Colonne de total : somme des colonnes listées (cases hachurées ignorées).
  somme?: string[];
  // Valeur décimale autorisée (ex. un taux) ; sinon entier positif.
  decimal?: boolean;
  // Jamais additionnée par une ligne de total (ex. un taux) : la case de la
  // ligne de total est alors à saisir.
  horsTotal?: boolean;
}

export interface Fusion {
  // Cases fusionnées sur la ligne : la valeur est portée par la première.
  colonnes: string[];
}

export interface Ligne {
  id: string;
  ref?: string;
  libelle: string;
  // Sous-libellé de la ligne (« Cas », « Décès »).
  sousLibelle?: string;
  // Ligne de titre de section, sans case.
  section?: boolean;
  // Ligne de total : somme des lignes listées.
  somme?: string[];
  // Colonnes hachurées (« Ne rien inscrire dans les parties hachurées »).
  hachures?: string[];
  fusions?: Fusion[];
  // Champ texte de précision (ex. « Autres : …… »).
  precision?: boolean;
}

export interface BlocTableau {
  type: "tableau";
  id: string;
  titre?: string;
  // En-tête de la colonne des libellés (ex. « Affections »).
  enteteLibelle: string;
  avecRef?: boolean;
  colonnes: Colonne[];
  lignes: Ligne[];
}

export interface ElementOuiNon {
  id: string;
  libelle: string;
}

export interface BlocOuiNon {
  type: "oui_non";
  id: string;
  titre: string;
  elements: ElementOuiNon[];
}

export interface ChampTexte {
  id: string;
  libelle: string;
  nature: "texte" | "texte_long" | "nombre";
}

export interface BlocChamps {
  type: "champs";
  id: string;
  titre?: string;
  champs: ChampTexte[];
}

export type Bloc = BlocTableau | BlocOuiNon | BlocChamps;

export interface DefinitionFormulaire {
  code: string;
  version: string;
  titre: string;
  // Lignes d'en-tête officielles, telles qu'imprimées.
  emetteur: string[];
  periodicite: Periodicite;
  entete: CleEntete[];
  blocs: Bloc[];
  // Mentions imprimées sur le formulaire (renvois, consignes).
  notes: string[];
}

export type ValeurSaisie = number | string | boolean;
export type ValeursRapport = Record<string, ValeurSaisie>;
