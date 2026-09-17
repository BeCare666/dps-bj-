export interface Formation {
  id: string;
  titre: string;
  description: string;
  dureeHeures: number | null;
  prixIndividuel: number;
  prixGroupe5: number;
  prixGroupe10: number;
  actif: boolean;
}

export type TypeEtablissement = "EH" | "ESPC";
export type StatutGrille = "BROUILLON" | "PUBLIEE" | "ARCHIVEE";
export type StatutSessionEvaluation = "EN_COURS" | "SOUMISE";
export type TypeReponse = "OUI_NON" | "TEXTE" | "CHOIX";
export type StatutAbonnement = "ESSAI" | "ACTIF" | "EXPIRE";
export type ModuleMetier = "NEWS" | "EI";

export interface Organisation {
  id: string;
  nom: string;
  ifu: string;
  type: TypeEtablissement;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  actif: boolean;
}

export interface ElementMesurable {
  id: string;
  libelle: string;
  typeReponse: TypeReponse;
  optionsChoix: string[] | null;
  ordre: number;
}

export interface Critere {
  id: string;
  code: string;
  libelle: string;
  ordre: number;
  elementsMesurables: ElementMesurable[];
}

export interface Norme {
  id: string;
  code: string;
  libelle: string;
  ordre: number;
  criteres: Critere[];
}

export interface Domaine {
  id: string;
  nom: string;
  ordre: number;
  normes: Norme[];
}

export interface Grille {
  id: string;
  nom: string;
  type: TypeEtablissement;
  version: number;
  statut: StatutGrille;
  domaines?: Domaine[];
}

export interface Reponse {
  id: string;
  sessionId: string;
  elementMesurableId: string;
  valeur: unknown;
  commentaire: string | null;
}

export interface SessionEvaluation {
  id: string;
  organisationId: string;
  grilleId: string;
  statut: StatutSessionEvaluation;
  scoreGlobal: number | null;
  dateDebut: string;
  dateSoumission: string | null;
  grille: Grille;
  reponses: Reponse[];
}

export interface SessionEvaluationResume {
  id: string;
  statut: StatutSessionEvaluation;
  scoreGlobal: number | null;
  dateDebut: string;
  dateSoumission: string | null;
  grille: { id: string; nom: string; type: TypeEtablissement; version: number };
}

export interface ScoreParDomaine {
  domaineId: string;
  nom: string;
  criteresValides: number;
  criteresTotal: number;
  scorePct: number;
}

export interface CritereNonValide {
  critereId: string;
  code: string;
  libelle: string;
  domaineNom: string;
}

export interface ResultatScore {
  scoreGlobal: number;
  parDomaine: ScoreParDomaine[];
  criteresNonValides: CritereNonValide[];
}

export interface PointEvolution {
  id: string;
  dateSoumission: string;
  scoreGlobal: number;
  grille: { nom: string; version: number };
}

export interface AbonnementModule {
  statut: StatutAbonnement;
  essaiFin: string;
  activeLe: string | null;
}

// --- Module NEWS ---

export type StatutPatient = "HOSPITALISE" | "SORTI";
export type NiveauConscience = "ALERTE" | "CONFUSION" | "VOIX" | "DOULEUR" | "INCONSCIENT";
export type NiveauRisqueNews = "BAS" | "MOYEN" | "ELEVE";
export type StatutAlerte = "OUVERTE" | "EN_COURS" | "CLOTUREE";

export interface Service {
  id: string;
  nom: string;
  description: string | null;
}

export interface Patient {
  id: string;
  organisationId: string;
  serviceId: string | null;
  nom: string;
  prenom: string;
  dateNaissance: string | null;
  sexe: string | null;
  numeroDossier: string | null;
  statut: StatutPatient;
  dateAdmission: string;
  dateSortie: string | null;
}

export interface MesureNews {
  id: string;
  patientId: string;
  frequenceRespiratoire: number;
  saturationOxygene: number;
  oxygenoSupplementation: boolean;
  temperature: number;
  pressionArterielleSystolique: number;
  frequenceCardiaque: number;
  niveauConscience: NiveauConscience;
  scoreTotal: number;
  niveauRisque: NiveauRisqueNews;
  dateMesure: string;
}

export interface Intervention {
  id: string;
  alerteId: string;
  utilisateurId: string;
  note: string;
  createdAt: string;
}

export interface Alerte {
  id: string;
  organisationId: string;
  patientId: string;
  mesureId: string;
  niveauRisque: NiveauRisqueNews;
  statut: StatutAlerte;
  createdAt: string;
  patient?: Patient;
  mesure?: MesureNews;
  interventions?: Intervention[];
}

// --- Module Événements indésirables ---

export type GraviteEi = "FAIBLE" | "MODEREE" | "ELEVEE";
export type StatutEi = "DECLARE" | "EN_TRAITEMENT" | "CLOTURE";
export type TypeCause = "IMMEDIATE" | "PROFONDE";
export type StatutActionCorrective = "A_FAIRE" | "EN_COURS" | "REALISEE";

export interface TypeEi {
  id: string;
  libelle: string;
  actif: boolean;
}

export interface Cause {
  id: string;
  evenementId: string;
  type: TypeCause;
  description: string;
  createdAt: string;
}

export interface ActionCorrective {
  id: string;
  evenementId: string;
  description: string;
  responsableId: string;
  echeance: string;
  statut: StatutActionCorrective;
}

export interface EvenementTransition {
  id: string;
  ancienStatut: StatutEi;
  nouveauStatut: StatutEi;
  utilisateurId: string;
  createdAt: string;
}

export interface PieceJointe {
  id: string;
  url: string;
  nomFichier: string;
  typeMime: string | null;
  createdAt: string;
}

export interface EvenementIndesirable {
  id: string;
  organisationId: string;
  typeEiId: string | null;
  serviceId: string | null;
  critereId: string | null;
  declareParId: string;
  description: string;
  gravite: GraviteEi | null;
  statut: StatutEi;
  dateDeclaration: string;
  dateCloture: string | null;
  typeEi?: TypeEi | null;
  service?: Service | null;
  declarePar?: { id: string; nom: string; prenom: string; email: string };
  causes?: Cause[];
  actionsCorrectives?: ActionCorrective[];
  transitions?: EvenementTransition[];
  piecesJointes?: PieceJointe[];
}

export interface TableauDeBordEi {
  total: number;
  parStatut: Record<string, number>;
  parGravite: Record<string, number>;
  parService: Record<string, number>;
  tauxCloture: number;
  delaiMoyenClotureJours: number | null;
}
