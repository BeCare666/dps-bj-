import type { SVGProps, JSX } from "react";
import {
  IconBarChart,
  IconCamera,
  IconChecklist,
  IconCookie,
  IconFileText,
  IconGraduationCap,
  IconGrid,
  IconHospital,
  IconInfo,
  IconLock,
  IconLogin,
  IconMail,
  IconRoute,
  IconScale,
  IconShieldAlert,
  IconShieldCheck,
  IconTarget,
  IconUserPlus,
  IconVitals,
  IconOrganisation,
} from "@/components/icons";
import { SITE } from "@/lib/site-config";

type Icone = (props: SVGProps<SVGSVGElement>) => JSX.Element;

export interface LienVitrine {
  href: string;
  label: string;
  icon: Icone;
}

export interface MenuVitrine {
  titre: string;
  icon: Icone;
  liens: LienVitrine[];
}

// Source unique des menus de la vitrine : le footer affiche ces colonnes telles
// quelles ; l'en-tête et le tiroir mobile les réorganisent (MENUS_EN_TETE).
export const MENUS_VITRINE: MenuVitrine[] = [
  {
    titre: "Services",
    icon: IconGrid,
    liens: [
      { href: "/plateforme/auto-evaluation", label: "Auto-évaluation qualité", icon: IconChecklist },
      { href: "/plateforme/score-news", label: "Score NEWS", icon: IconVitals },
      { href: "/plateforme/evenements-indesirables", label: "Événements indésirables", icon: IconShieldAlert },
      { href: "/formations", label: "Formations", icon: IconGraduationCap },
    ],
  },
  {
    titre: "Établissement",
    icon: IconOrganisation,
    liens: [
      { href: "/inscription", label: "Créer un compte", icon: IconUserPlus },
      { href: "/login", label: "Se connecter", icon: IconLogin },
      { href: "/#etablissements", label: "Hôpitaux et centres de santé", icon: IconHospital },
      { href: "/#securite", label: "Sécurité des données", icon: IconLock },
    ],
  },
  {
    titre: "À propos",
    icon: IconInfo,
    liens: [
      { href: "/a-propos/notre-mission", label: "Notre mission", icon: IconTarget },
      { href: "/a-propos/comment-ca-marche", label: "Comment ça marche", icon: IconRoute },
      { href: `mailto:${SITE.emailContact}`, label: "Nous contacter", icon: IconMail },
    ],
  },
  {
    titre: "Informations légales",
    icon: IconScale,
    liens: [
      { href: "/mentions-legales", label: "Mentions légales", icon: IconScale },
      { href: "/conditions-utilisation", label: "Conditions d'utilisation", icon: IconFileText },
      { href: "/politique-confidentialite", label: "Politique de confidentialité", icon: IconShieldCheck },
      { href: "/politique-confidentialite#cookies", label: "Cookies", icon: IconCookie },
      { href: "/conditions-utilisation#credits", label: "Crédits photographiques", icon: IconCamera },
    ],
  },
];

export interface SectionMenu {
  // Sous-titre affiché au-dessus des liens (absent pour la première section).
  titre?: string;
  liens: LienVitrine[];
}

export interface MenuEnTete {
  titre: string;
  icon: Icone;
  // Lien direct (sans menu déroulant) : `sections` est alors vide.
  href?: string;
  sections: SectionMenu[];
}

// Domaines de la page Statistiques : les établissements y transmettent leurs
// statistiques au ministère (demande client du 2026-10-05).
export const DOMAINES_STATISTIQUES = [
  { slug: "transfusion", label: "Transfusion" },
  { slug: "epidemiologie", label: "Épidémiologie" },
  { slug: "pnlmnt", label: "Programme national de lutte contre les MNT (PNLMNT)" },
  { slug: "sante-sexuelle-reproductive", label: "Santé sexuelle et reproductive" },
] as const;

// Menus de l'en-tête et du tiroir mobile (demande client du 2026-10-05) :
// Accueil, À propos, Services, Statistiques. « Accueil » est un lien simple,
// rendu directement par l'en-tête. « Établissement » et « Informations
// légales » restent dans le footer ; connexion et inscription sont des boutons.
function menu(titre: string): MenuVitrine {
  const trouve = MENUS_VITRINE.find((m) => m.titre === titre);
  if (!trouve) throw new Error(`Menu de vitrine introuvable : ${titre}`);
  return trouve;
}

export const MENUS_EN_TETE: MenuEnTete[] = [
  {
    titre: "À propos",
    icon: menu("À propos").icon,
    // Premier lien : la page À propos elle-même (présentation générale).
    sections: [{ liens: [{ href: "/a-propos", label: "À propos", icon: IconInfo }, ...menu("À propos").liens] }],
  },
  { titre: "Services", icon: menu("Services").icon, sections: [{ liens: menu("Services").liens }] },
  // ROADMAP_FORMATIONS_VERIFICATION.md §6 — liens directs après « Services ».
  { titre: "Formations", icon: IconGraduationCap, href: "/formations", sections: [] },
  { titre: "Vérifier votre établissement", icon: IconShieldCheck, href: "/verifier-etablissement", sections: [] },
  {
    titre: "Statistiques",
    icon: IconBarChart,
    sections: [
      {
        liens: DOMAINES_STATISTIQUES.map((d) => ({ href: `/statistiques/${d.slug}`, label: d.label, icon: IconBarChart })),
      },
    ],
  },
];
