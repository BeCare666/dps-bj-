export enum RoleUtilisateur {
  RESPONSABLE_COMPTE = "responsable_compte",
  RESPONSABLE_QUALITE = "resp_qualite",
  PERSONNEL_SOIGNANT = "personnel_soignant",
  GESTIONNAIRE_FORMATION = "gestionnaire_formation",
}

export enum ModulePlateforme {
  AUTO_EVALUATION = "auto_evaluation",
  NEWS = "news",
  EVENEMENTS_INDESIRABLES = "ei",
  FORMATIONS = "formations",
}

export enum StatutAbonnementModule {
  ESSAI = "essai",
  ACTIF = "actif",
  EXPIRE = "expire",
}

export enum NiveauRisqueNews {
  FAIBLE = "faible",
  MOYEN = "moyen",
  ELEVE = "eleve",
}

export enum StatutEvenementIndesirable {
  DECLARE = "declare",
  QUALIFIE = "qualifie",
  EN_ANALYSE = "en_analyse",
  PLAN_ACTION = "plan_action",
  CLOTURE = "cloture",
}

export enum CategorieArs {
  EH = "EH",
  ESPC = "ESPC",
}
