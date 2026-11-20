// Informations publiques de la vitrine, centralisées ici pour que le header,
// le footer et les pages légales restent cohérents entre eux.
//
// L'adresse de contact contact@dps.bj a été confirmée par le porteur du projet
// le 17/11/2026. À CONFIRMER encore avant la mise en production : les URL des
// réseaux sociaux ci-dessous suivent le nom de domaine prévu par le CDC (dps.bj)
// mais n'ont pas été fournies explicitement.
export const SITE = {
  nom: "DSP",
  nomComplet: "Dispositif de Sécurité des Patients",
  pays: "République du Bénin",
  emailContact: "contact@dps.bj",
  // Date de dernière mise à jour des documents légaux (CGU, confidentialité).
  majDocumentsLegaux: "17 novembre 2026",
} as const;

// Éditeur du site, affiché dans les mentions légales. Informations fournies par
// le porteur du projet le 18/11/2026. Les champs à null n'ont pas encore été
// communiqués : ils ne sont pas affichés tant qu'ils restent vides.
export const EDITEUR = {
  raisonSociale: "HOUEDONOU ET FILS",
  formeJuridique: "Société à responsabilité limitée (SARL)",
  adresse: "Ilot 147, quartier Foun-Foun Sodji, parcelle R, maison Emile GBENOU, Porto-Novo",
  rccm: "RCCM RB/PNO/24 B 5316",
  ifu: "3202659045743" as string | null,
  telephone: "+229 01 61 61 47 47",
  telephoneHref: "tel:+2290161614747",
  // Directeur de la publication : nom et fonction fournis le 18/11/2026.
  directeurPublication: { nom: "M. GBENOU Habib Todegnon Isaac Mawunan", fonction: "PDG" } as {
    nom: string;
    fonction: string | null;
  } | null,
};

// Hébergeurs : coordonnées relevées sur leurs sites officiels le 17/11/2026.
export const HEBERGEURS = [
  {
    role: "Site web",
    societe: "Vercel Inc.",
    adresse: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
    email: "privacy@vercel.com",
    site: "https://vercel.com",
  },
  {
    role: "Serveur applicatif (API)",
    societe: "Render Inc.",
    adresse: null,
    email: "support@render.com",
    site: "https://render.com",
  },
  {
    role: "Base de données",
    societe: "PingCAP Pte. Ltd. (service TiDB Cloud)",
    adresse: null,
    email: "legal@pingcap.com",
    site: "https://www.pingcap.com",
  },
  {
    role: "Pièces jointes des événements indésirables",
    societe: "Cloudinary Ltd.",
    adresse: null,
    email: "privacy@cloudinary.com",
    site: "https://cloudinary.com",
  },
] as const;

export type ReseauSocial = "facebook" | "linkedin" | "x" | "instagram" | "youtube";

export const RESEAUX_SOCIAUX: { reseau: ReseauSocial; label: string; href: string }[] = [
  { reseau: "facebook", label: "Facebook", href: "https://www.facebook.com/dps.bj" },
  { reseau: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/dps-bj" },
  { reseau: "x", label: "X", href: "https://x.com/dps_bj" },
  { reseau: "instagram", label: "Instagram", href: "https://www.instagram.com/dps.bj" },
  { reseau: "youtube", label: "YouTube", href: "https://www.youtube.com/@dps-bj" },
];

// Photographies de la vitrine : toutes issues de Wikimedia Commons, sous
// licence libre. L'attribution est obligatoire (CC BY-SA), elle est affichée
// dans la section "Crédits photographiques" des conditions d'utilisation.
export const PHOTOS = {
  medecin: {
    src: "/images/vitrine/medecin-blouse-blanche.jpg",
    alt: "Jeune médecin en blouse blanche",
    largeur: 1280,
    hauteur: 1918,
    auteur: "Freed Armel",
    licence: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Jeune_m%C3%A9decin_en_blousse_blanche.jpg",
  },
  sageFemme: {
    src: "/images/vitrine/sage-femme-maternite-lagune-cotonou.jpg",
    alt: "Sage-femme prodiguant des soins à un nouveau-né, maternité de la Lagune, Cotonou",
    largeur: 1920,
    hauteur: 1256,
    auteur: "Ji-Elle",
    licence: "CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Cotonou-Maternit%C3%A9_de_la_Lagune_(2).jpg",
  },
  cnhu: {
    src: "/images/vitrine/cnhu-hkm-cotonou.jpg",
    alt: "Entrée du Centre National Hospitalier Universitaire Hubert Koutoukou Maga, Cotonou",
    largeur: 1920,
    hauteur: 1440,
    auteur: "Alex Ahdn",
    licence: "CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Centre_National_hospitalier_Universitaire_Hubert_Koutoukou_MAGA_01.jpg",
  },
  centreSante: {
    src: "/images/vitrine/centre-sante-agame.jpg",
    alt: "Centre de santé d'Agamè, commune de Lokossa, Mono-Couffo",
    largeur: 1920,
    hauteur: 1280,
    auteur: "Adoscam",
    licence: "CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Centre_de_sant%C3%A9_d%27Agam%C3%A8_au_B%C3%A9nin_03_(cropped).jpg",
  },
} as const;
