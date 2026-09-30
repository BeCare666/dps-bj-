// Catalogue partagé des permissions — source unique consommée par apps/api
// (PermissionsGuard, application réelle) et apps/web (affichage conditionnel
// uniquement — jamais une couche de sécurité, l'autorisation réelle est
// toujours vérifiée côté API).
//
// Portée volontairement restreinte à ce qui existe réellement aujourd'hui, ou
// débloque directement les prochaines phases validées (établissements,
// utilisateurs). Pas de permission « fantôme » pour un module pas encore
// construit (analytics, audit, alertes, système, paramètres...) — chacune
// sera ajoutée avec son module correspondant, au moment où il existe.

export type RoleUtilisateur =
  | "RESPONSABLE_COMPTE"
  | "RESP_QUALITE"
  | "PERSONNEL_SOIGNANT"
  | "GESTIONNAIRE_FORMATION"
  | "ADMIN_PLATEFORME";

export type Permission =
  | "ORGANISATIONS_READ"
  | "ORGANISATIONS_MANAGE"
  | "USERS_READ"
  | "USERS_CREATE"
  | "USERS_UPDATE"
  | "USERS_DISABLE"
  | "NEWS_READ"
  | "NEWS_CREATE"
  | "NEWS_UPDATE"
  | "EI_READ"
  | "EI_CREATE"
  | "EI_UPDATE"
  | "EI_EXPORT"
  | "AUTO_EVALUATION_READ"
  | "AUTO_EVALUATION_CREATE"
  | "AUTO_EVALUATION_MANAGE"
  | "FORMATIONS_MANAGE"
  | "RESERVATIONS_READ"
  | "RESERVATIONS_MANAGE"
  | "AUDIT_READ"
  | "INTEGRATIONS_READ"
  | "ALERTES_READ"
  | "ANALYTICS_READ"
  | "PARAMETRES_READ"
  | "PARAMETRES_MANAGE"
  | "SECURITE_READ";

// RM7 (isolation multi-tenant, voir ROADMAP.md) — rappel structurel : une
// permission dit CE QU'un rôle peut faire, jamais OÙ (organisationId). Ne
// jamais déduire un accès multi-organisation à partir d'une permission seule
// — voir PermissionsGuard côté API, qui ne remplace ni ne bypass jamais le
// filtrage par organisationId déjà en place dans chaque service.
export const ROLE_PERMISSIONS: Record<RoleUtilisateur, readonly Permission[]> = {
  // Aucun accès NEWS/EI : un compte ADMIN_PLATEFORME n'a pas d'organisationId
  // et ne peut structurellement pas passer les vérifications exigerOrganisation()
  // des services NEWS/EI — lui donner ces permissions serait trompeur.
  ADMIN_PLATEFORME: [
    "ORGANISATIONS_READ",
    "ORGANISATIONS_MANAGE",
    "USERS_READ",
    "USERS_CREATE",
    "USERS_UPDATE",
    "USERS_DISABLE",
    "AUTO_EVALUATION_MANAGE",
    "FORMATIONS_MANAGE",
    "RESERVATIONS_READ",
    "RESERVATIONS_MANAGE",
    "AUDIT_READ",
    "INTEGRATIONS_READ",
    "ALERTES_READ",
    "ANALYTICS_READ",
    "PARAMETRES_READ",
    "PARAMETRES_MANAGE",
    "SECURITE_READ",
  ],
  RESPONSABLE_COMPTE: [
    "NEWS_READ",
    "NEWS_CREATE",
    "NEWS_UPDATE",
    "EI_READ",
    "EI_CREATE",
    "EI_UPDATE",
    "EI_EXPORT",
    "AUTO_EVALUATION_READ",
    "AUTO_EVALUATION_CREATE",
  ],
  RESP_QUALITE: [
    "NEWS_READ",
    "NEWS_CREATE",
    "NEWS_UPDATE",
    "EI_READ",
    "EI_CREATE",
    "EI_UPDATE",
    "EI_EXPORT",
    "AUTO_EVALUATION_READ",
    "AUTO_EVALUATION_CREATE",
  ],
  // EI_READ/EI_CREATE inclus : EvenementsIndesirablesController n'a aujourd'hui
  // aucune restriction de rôle sur la déclaration/consultation (déclaration
  // large, RM10) — tout compte organisation peut déclarer un EI, y compris ce
  // rôle. NEWS_UPDATE inclus pour la même raison de fidélité à l'existant :
  // PatientsController/AlertesController appliquent leur @Roles au niveau du
  // contrôleur entier, donc ce rôle a aujourd'hui exactement les mêmes actions
  // NEWS que RESP_QUALITE/RESPONSABLE_COMPTE (saisie, clôture, intervention,
  // changement de statut d'alerte) — pas de distinction plus fine possible
  // sans modifier le contrôleur, hors périmètre de cette phase.
  PERSONNEL_SOIGNANT: ["NEWS_READ", "NEWS_CREATE", "NEWS_UPDATE", "EI_READ", "EI_CREATE"],
  // Câblé aux seules fonctionnalités Formation (décision explicite) : jamais
  // ORGANISATIONS_*, USERS_*, NEWS_*, EI_*, ni AUTO_EVALUATION_*.
  GESTIONNAIRE_FORMATION: ["FORMATIONS_MANAGE", "RESERVATIONS_READ", "RESERVATIONS_MANAGE"],
};

export function resoudrePermissions(roles: readonly RoleUtilisateur[]): Permission[] {
  const permissions = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      permissions.add(permission);
    }
  }
  return [...permissions];
}

export function aLaPermission(roles: readonly RoleUtilisateur[], permission: Permission): boolean {
  return resoudrePermissions(roles).includes(permission);
}
