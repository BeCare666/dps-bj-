// Fichier généré par apps/api/prisma/formations-ars/convertir_docx.py, ne pas modifier.
// Source : « Programmes de formation EH.docx », section 4 (socle commun et parcours).
import type { ParcoursFormationsEh } from "./types.js";

export const PARCOURS_FORMATIONS_EH: ParcoursFormationsEh = {
  "socle": {
    "titre": "Socle commun pour tout le personnel (environ 40 h)",
    "etapes": [
      {
        "etape": "Jour 1",
        "libelle": "Socle sécurité des patients (E.1.1.1) : 7 h.",
        "criteres": [
          "E.1.1.1"
        ]
      },
      {
        "etape": "Jour 2",
        "libelle": "Prévention et contrôle des infections (C.2.1.1) : 7 h.",
        "criteres": [
          "C.2.1.1"
        ]
      },
      {
        "etape": "Jour 3",
        "libelle": "Hygiène des mains (C.2.2.5), protection du personnel et AES (C.2.2.7), identitovigilance (B.3.1.1), confidentialité (B.3.2.2) : 8 h.",
        "criteres": [
          "C.2.2.5",
          "C.2.2.7",
          "B.3.1.1",
          "B.3.2.2"
        ]
      },
      {
        "etape": "Jour 4",
        "libelle": "Déchets et tri (D.2.2.1, D.2.2.5), sécurité incendie (D.1.2.8), badge (D.1.2.5), non-fumeur (D.1.2.14) : 8,5 h.",
        "criteres": [
          "D.2.2.1",
          "D.2.2.5",
          "D.1.2.8",
          "D.1.2.5",
          "D.1.2.14"
        ]
      },
      {
        "etape": "Jour 5",
        "libelle": "Prévention de la violence (A.5.2.2) : 7 h.",
        "criteres": [
          "A.5.2.2"
        ]
      },
      {
        "etape": "Session courte",
        "libelle": "Plans d'urgence, volet personnel (D.1.2.6) : 2 h, suivie de l'exercice annuel.",
        "criteres": [
          "D.1.2.6"
        ]
      }
    ]
  },
  "parcours": [
    {
      "nom": "Infirmier en service d'hospitalisation",
      "formations": "C.1.1.3, C.1.1.4, C.1.1.5, C.1.2.4, C.1.2.5, C.1.2.8, C.2.2.3, C.3.1.1, C.3.1.2, C.4.1.2, C.4.1.3, C.4.2.3, C.4.2.6, A.4.2.3, A.5.2.6, B.3.2.1",
      "criteres": [
        "C.1.1.3",
        "C.1.1.4",
        "C.1.1.5",
        "C.1.2.4",
        "C.1.2.5",
        "C.1.2.8",
        "C.2.2.3",
        "C.3.1.1",
        "C.3.1.2",
        "C.4.1.2",
        "C.4.1.3",
        "C.4.2.3",
        "C.4.2.6",
        "A.4.2.3",
        "A.5.2.6",
        "B.3.2.1"
      ],
      "volumeHeures": 56.0
    },
    {
      "nom": "Sage-femme",
      "formations": "C.1.1.6, B.2.1.1, C.3.1.1, C.3.2.2, C.4.2.5, C.2.2.4, A.5.2.6",
      "criteres": [
        "C.1.1.6",
        "B.2.1.1",
        "C.3.1.1",
        "C.3.2.2",
        "C.4.2.5",
        "C.2.2.4",
        "A.5.2.6"
      ],
      "volumeHeures": 41.0
    },
    {
      "nom": "Équipe de bloc opératoire",
      "formations": "C.1.1.2, C.2.1.2, C.2.2.8, B.2.1.1, C.3.2.1, C.4.2.5",
      "criteres": [
        "C.1.1.2",
        "C.2.1.2",
        "C.2.2.8",
        "B.2.1.1",
        "C.3.2.1",
        "C.4.2.5"
      ],
      "volumeHeures": 32.0
    },
    {
      "nom": "Médecin prescripteur",
      "formations": "C.1.2.1, C.2.2.4, C.4.2.1, C.4.2.2, C.1.2.6, C.1.2.4, B.2.2.2, B.5.2.1",
      "criteres": [
        "C.1.2.1",
        "C.2.2.4",
        "C.4.2.1",
        "C.4.2.2",
        "C.1.2.6",
        "C.1.2.4",
        "B.2.2.2",
        "B.5.2.1"
      ],
      "volumeHeures": 29.0
    },
    {
      "nom": "Agent d'entretien",
      "formations": "D.1.2.13, D.2.1.1, D.2.2.2, C.2.2.3",
      "criteres": [
        "D.1.2.13",
        "D.2.1.1",
        "D.2.2.2",
        "C.2.2.3"
      ],
      "volumeHeures": 13.0
    },
    {
      "nom": "Encadrement et direction",
      "formations": "A.1.2.2, A.6.2.1, D.1.2.6 (volet encadrement), E.2.3.2, B.6.3.1",
      "criteres": [
        "A.1.2.2",
        "A.6.2.1",
        "D.1.2.6",
        "E.2.3.2",
        "B.6.3.1"
      ],
      "volumeHeures": 46.0
    }
  ]
};
