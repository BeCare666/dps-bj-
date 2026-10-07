// Seed de développement — dps.bj
// - Compte admin plateforme initial
// - Grilles EH/ESPC PLACEHOLDER (structure minimale) pour débloquer le développement
//   des sessions d'auto-évaluation avant que le contenu réel du CDC soit fourni.
//   ⚠️ À remplacer par le vrai référentiel avant toute mise en production.
import "dotenv/config";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient, TypeCompte, RoleUtilisateur, TypeEtablissement, StatutGrille, TypeReponse, NiveauAutorite } from "../src/generated/prisma/client.js";
import { cleRapprochement } from "@dps/shared";
import { createTidbAdapter } from "../src/prisma/create-tidb-adapter.js";

const certsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "certs");
const adapter = createTidbAdapter(process.env.DATABASE_URL!, join(certsDir, "tidb-ca.pem"));
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "houedonou.fils@gmail.com";
  const existing = await prisma.utilisateur.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin plateforme déjà présent (${email}), aucune modification.`);
    return;
  }

  const password = process.env.ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");
  const motDePasseHash = await bcrypt.hash(password, 12);

  const admin = await prisma.utilisateur.create({
    data: {
      typeCompte: TypeCompte.ADMIN_PLATEFORME,
      email,
      motDePasseHash,
      nom: "Admin",
      prenom: "Plateforme",
      emailVerifieLe: new Date(), // provisionné directement par la plateforme, pas via l'inscription publique
      roles: { create: { role: RoleUtilisateur.ADMIN_PLATEFORME } },
    },
  });

  console.log(`Compte admin plateforme créé : ${admin.email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`Mot de passe généré (à noter, non réaffiché) : ${password}`);
  }
}

async function seedGrillePlaceholder(type: TypeEtablissement) {
  const nom = `Grille ${type} — placeholder`;
  const existing = await prisma.grille.findUnique({ where: { nom_version: { nom, version: 1 } } });
  if (existing) {
    console.log(`${nom} v1 déjà présente, aucune modification.`);
    return;
  }

  await prisma.grille.create({
    data: {
      nom,
      type,
      version: 1,
      statut: StatutGrille.PUBLIEE,
      publieeLe: new Date(),
      domaines: {
        create: [
          {
            nom: "Domaine placeholder 1",
            ordre: 1,
            normes: {
              create: [
                {
                  code: "N1",
                  libelle: "Norme placeholder 1",
                  ordre: 1,
                  criteres: {
                    create: [
                      {
                        code: "C1",
                        libelle: "Critère placeholder 1",
                        ordre: 1,
                        elementsMesurables: {
                          create: [
                            { libelle: "Élément mesurable placeholder 1.1", typeReponse: TypeReponse.OUI_NON, ordre: 1 },
                            { libelle: "Élément mesurable placeholder 1.2", typeReponse: TypeReponse.OUI_NON, ordre: 2 },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`${nom} v1 créée.`);
}

// D8 — provisionne la seule ligne de paramètre validée à ce jour. Le
// paramètre n'existe qu'ici : l'API ne permet jamais de créer une nouvelle
// clé, seulement de modifier une clé déjà seedée (voir ParametresService).
async function seedParametres() {
  const cle = "duree_essai_module_jours";
  const existant = await prisma.parametrePlateforme.findUnique({ where: { cle } });
  if (existant) {
    console.log(`Paramètre ${cle} déjà présent, aucune modification.`);
    return;
  }

  const valeurDefaut = process.env.DUREE_ESSAI_MODULE_JOURS ?? "90";
  await prisma.parametrePlateforme.create({
    data: {
      cle,
      valeur: valeurDefaut,
      type: "entier",
      description: "Durée (en jours) de l'essai gratuit accordé à un établissement à la première utilisation d'un module NEWS ou EI (RM6).",
      valeurDefaut,
    },
  });
  console.log(`Paramètre ${cle} créé (valeur : ${valeurDefaut}).`);
}

// Rapports statistiques — autorités destinataires FICTIVES (décision client du
// 07/10/2026 : « des comptes des ZS et autres fictifs pour le moment »). La
// zone « PAS » (Ouémé) est celle inscrite sur les formulaires papier fournis.
// Adresses en .invalid (domaine réservé, aucun email ne part). À remplacer
// par les vrais comptes avant la mise en production.
const AUTORITES_FICTIVES = [
  {
    nom: "[FICTIF] Zone sanitaire PAS",
    niveau: NiveauAutorite.ZONE_SANITAIRE,
    departement: "OUEME",
    zoneSanitaire: "PAS",
    email: "zs-pas@fictif.dsp.invalid",
    nomUtilisateur: "Zone sanitaire PAS",
  },
  {
    nom: "[FICTIF] Direction départementale de la santé de l'Ouémé",
    niveau: NiveauAutorite.DEPARTEMENT,
    departement: "OUEME",
    zoneSanitaire: null,
    email: "dds-oueme@fictif.dsp.invalid",
    nomUtilisateur: "DDS Ouémé",
  },
  {
    nom: "[FICTIF] Ministère de la Santé",
    niveau: NiveauAutorite.NATIONAL,
    departement: null,
    zoneSanitaire: null,
    email: "ministere@fictif.dsp.invalid",
    nomUtilisateur: "Ministère de la Santé",
  },
];

async function seedAutoritesFictives() {
  for (const a of AUTORITES_FICTIVES) {
    const existant = await prisma.utilisateur.findUnique({ where: { email: a.email } });
    if (existant) {
      console.log(`Autorité fictive déjà présente (${a.email}), aucune modification.`);
      continue;
    }
    const password = process.env.AUTORITES_FICTIVES_PASSWORD ?? randomBytes(9).toString("base64url");
    const autorite = await prisma.autoriteSanitaire.create({
      data: {
        nom: a.nom,
        niveau: a.niveau,
        departement: a.departement,
        zoneSanitaire: a.zoneSanitaire,
        zoneSanitaireCle: a.zoneSanitaire ? cleRapprochement(a.zoneSanitaire) : null,
      },
    });
    await prisma.utilisateur.create({
      data: {
        typeCompte: TypeCompte.AUTORITE_SANITAIRE,
        autoriteSanitaireId: autorite.id,
        email: a.email,
        motDePasseHash: await bcrypt.hash(password, 12),
        nom: a.nomUtilisateur,
        prenom: "Compte fictif",
        emailVerifieLe: new Date(),
        roles: { create: { role: RoleUtilisateur.AUTORITE_SANITAIRE } },
      },
    });
    console.log(`Autorité fictive créée : ${a.nom} — ${a.email}`);
    if (!process.env.AUTORITES_FICTIVES_PASSWORD) console.log(`  Mot de passe généré (à noter, non réaffiché) : ${password}`);
  }
}

async function main() {
  await seedAdmin();
  await seedGrillePlaceholder(TypeEtablissement.EH);
  await seedGrillePlaceholder(TypeEtablissement.ESPC);
  await seedParametres();
  await seedAutoritesFictives();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
