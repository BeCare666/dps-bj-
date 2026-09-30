import {
  IconHome,
  IconChecklist,
  IconVitals,
  IconShieldAlert,
  IconGraduationCap,
  IconCalendar,
  IconOrganisation,
  IconUser,
  IconSettings,
} from "@/components/icons";
import type { GroupeNav } from "@/components/shell/sidebar-nav";

// Sidebar côté organisation. « Paramètres » pointe vers la page de sécurité du
// compte (/mes-sessions, sessions actives) : c'est aujourd'hui le seul réglage
// propre à un compte utilisateur.
const GROUPE_TABLEAU_DE_BORD: GroupeNav = {
  liens: [{ href: "/tableau-de-bord", label: "Tableau de bord", icon: IconHome, exact: true }],
};

const GROUPE_QUALITE_SOINS: GroupeNav = {
  titre: "Qualité & soins",
  liens: [
    { href: "/auto-evaluation", label: "Auto-évaluation", icon: IconChecklist },
    { href: "/news", label: "NEWS", icon: IconVitals },
    { href: "/evenements-indesirables", label: "Événements indésirables", icon: IconShieldAlert },
  ],
};

const GROUPE_FORMATIONS: GroupeNav = {
  titre: "Formations",
  liens: [
    { href: "/formations", label: "Catalogue", icon: IconGraduationCap },
    { href: "/mes-reservations", label: "Mes réservations", icon: IconCalendar },
  ],
};

const GROUPE_ETABLISSEMENT: GroupeNav = {
  titre: "Établissement",
  liens: [{ href: "/organisation", label: "Mon établissement", icon: IconOrganisation }],
};

const GROUPE_COMPTE: GroupeNav = {
  titre: "Compte",
  liens: [
    { href: "/profil", label: "Profil", icon: IconUser },
    { href: "/mes-sessions", label: "Paramètres", icon: IconSettings },
  ],
  avecDeconnexion: true,
};

export const GROUPES_ORGANISATION: GroupeNav[] = [
  GROUPE_TABLEAU_DE_BORD,
  GROUPE_QUALITE_SOINS,
  GROUPE_FORMATIONS,
  GROUPE_ETABLISSEMENT,
  GROUPE_COMPTE,
];

// Compte individuel : aucun module métier organisation (RM7, scopé
// organisation_id) — seuls formations/réservations s'appliquent (voir aussi
// l'ancienne logique équivalente dans app-header.tsx, Phase 3).
export const GROUPES_INDIVIDUEL: GroupeNav[] = [GROUPE_FORMATIONS, GROUPE_COMPTE];
