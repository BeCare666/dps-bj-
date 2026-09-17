# Roadmap de développement — dps.bj

Construite à partir du cahier des charges fonctionnel v0.2 (dps.bj — Dispositif de Sécurité des Patients).
Stack : Next.js (front) · NestJS (API) · MySQL sur TiDB Cloud · Cloudinary (médias) · Brevo (emails) · KKiaPay (paiements, imposé par le CDC).

Légende : ✅ fait · ⏳ à faire · ❓ en attente de décision/donnée du client

---

## 1. Analyse et préparation

- [x] **1.1** Lecture du cahier des charges (dps.bj CDC v0.2, 16 sections + glossaire)
- [x] **1.2** Extraction de toutes les exigences (4 modules + tronc commun + back-office admin, voir §6 ci-dessous)
- [x] **1.3** Acteurs identifiés : Compte Organisation (responsable), Utilisateurs internes, Compte Individuel, Administrateur plateforme
- [x] **1.4** Rôles identifiés : `responsable_compte`, `resp_qualite`, `personnel_soignant`, `gestionnaire_formation`, `admin_plateforme`
- [x] **1.5** Permissions : matrice détaillée produite (13 actions × 5 profils)
- [x] **1.6** Liste exhaustive des fonctionnalités par module (voir sections 6 à 9)
- [x] **1.7** Règles métier explicites du CDC :
  - RM1 — Un critère n'est validé que si tous ses éléments « document à examiner » sont positifs (§6.3)
  - RM2 — Le score (auto-éval, NEWS) est calculé côté serveur uniquement (§6.6, §7.5)
  - RM3 — Une session soumise référence une version figée de la grille, immuable ensuite (§6.6, §13.4)
  - RM4 — Une mesure NEWS ou un EI enregistré ne peut être supprimé, seule une correction tracée est possible (§13.4)
  - RM5 — Le tarif appliqué à une réservation est celui en vigueur au moment du paiement, copié sur la réservation (§9.3)
  - RM6 — Essai gratuit NEWS/EI = 3 mois (paramétrable, défaut 90 jours), bascule auto en payant (§5, §10.5)
  - RM7 — Isolation stricte par `organisation_id`, sans exception, même pour l'admin sur les données patient (§13.1, §12.3)
  - RM8 — Chaque transition de statut d'un EI est historisée, qui/quand (§8.5)
  - RM9 — Alerte NEWS moyen/élevé ou EI gravité élevée → notification automatique via mécanisme événementiel commun (§7.3, §8.3, §8.5)
  - RM10 — Le lien EI → critère auto-évaluation est optionnel, n'affecte jamais le score (§8.4)
  - RM11 — Tout paiement KKiaPay est revérifié côté serveur, jamais fié à la seule réponse client (§10.4)
- [x] **1.8** Dépendances entre fonctionnalités :
  - Modules NEWS/EI dépendent de `abonnements_module` (essai/actif/expiré)
  - Formation + abonnements NEWS/EI partagent la même intégration KKiaPay
  - Mécanisme d'alerte (event + notification) commun à NEWS et EI
  - EI peut référencer un critère Auto-évaluation (dépendance faible, optionnelle)
  - Dashboard admin agrège les données des 4 modules
  - Facturation dépend d'un abonnement OU d'une réservation formation
- [x] **1.9** Services externes : KKiaPay (paiement), Cloudinary (médias/PDF), Brevo (emails), TiDB Cloud (données)
- [x] **1.10** Ambiguïtés identifiées (11 points, voir analyse détaillée précédente — notamment comportement fin d'essai NEWS §5, transmission EI zone sanitaire/ministère §8.2, vérification IFU)
- [ ] **1.11** ❓ Validation de l'analyse par le client, en particulier les points d'ambiguïté du §1.10 et le choix MySQL/TiDB (divergence avec la recommandation PostgreSQL du CDC)

## 2. Architecture

- [x] **2.1** Architecture générale (Next.js ↔ NestJS API REST ↔ MySQL/TiDB, Redis/BullMQ pour l'async)
- [x] **2.2** Architecture Next.js (App Router, groupes de routes par module, Middleware pour les gardes)
- [x] **2.3** Architecture NestJS (modules par domaine métier, Guards, interceptors multi-tenant)
- [x] **2.4** Architecture MySQL/TiDB (schéma multi-tenant, index composites, JSON pour réponses libres)
- [x] **2.5** Architecture Cloudinary (pièces jointes EI, PDF rapports/factures, images formations)
- [x] **2.6** Architecture Brevo (7 notifications transactionnelles du §11.2)
- [x] **2.7** Authentification (JWT access+refresh, cookies httpOnly)
- [x] **2.8** Autorisation (RBAC multi-rôle + scoping organisation_id systématique)
- [x] **2.9** API (REST, DTO validés, un module NestJS par domaine)
- [ ] **2.10** ⏳ Gestion des erreurs (format d'erreur API standardisé, codes métier, exception filters NestJS) — à formaliser
- [x] **2.11** Sécurité (isolation stricte, immuabilité, audit, hachage mdp, vérification webhook)
- [x] **2.12** Technologies complémentaires (Prisma, BullMQ, Passport, Puppeteer, ExcelJS, CASL, TanStack Query, Zustand, shadcn/ui, Zod, Playwright, Docker, Sentry, Pino — voir tableau détaillé de l'analyse)
- [ ] **2.13** ❓ Validation de l'architecture par le client (notamment confirmation Prisma comme ORM, confirmation monorepo)

## 3. Initialisation du projet — ✅ FAIT (2026-09-16)

- [x] **3.1** Création frontend Next.js 16 (`apps/web` — TypeScript, ESLint, Tailwind, App Router)
- [x] **3.2** Création backend NestJS 12 (`apps/api` — TypeScript, Vitest)
- [x] **3.3** Configuration TypeScript (générée par les CLI, à affiner si besoin)
- [x] **3.4** Variables d'environnement créées : `apps/api/.env` + `apps/web/.env.local` (réels, gitignorés) et `.env.example` (committables, sans secret) dans les deux apps
- [x] **3.5** MySQL/TiDB Cloud configuré — cluster `gateway01.eu-central-1.prod.aws.tidbcloud.com:4000`, base applicative dédiée **`dps_bj`** créée (pas `sys`), TLS avec CA `apps/api/certs/tidb-ca.pem` (public, committé), connexion **confirmée** via Prisma (`prisma db execute`)
- [x] **3.6** Cloudinary configuré — cloud_name `dg9fitya`, API key/secret en place
- [x] **3.7** Brevo configuré — clé API en place, **email expéditeur validé manquant** (TODO dans `.env`)
- [x] **3.8** Prisma (`prisma` + `@prisma/client`) installé dans `apps/api`, `prisma7.config.ts` généré et fonctionnel. Override npm `mysql2@^3.24.4` ajouté au `package.json` racine (corrige une vulnérabilité haute dans la version que Prisma embarque par défaut). Reste à installer au fil des modules : BullMQ, Passport, class-validator, etc.
- [x] **3.9** Configuration Git (`git init` fait, monorepo avec `apps/*` + `packages/*`, `.gitignore` — **rien commité pour l'instant**)
- [x] **3.10** Vérification du build initial (`npm run build:api` et `build:web` : exit code 0)

## 4. Base de données — table par table (phasée)

**Phase V1 — comptes + auto-évaluation**
- [x] 4.1 `organisations`
- [x] 4.2 `utilisateurs`
- [x] 4.3 `utilisateur_roles` (relation utilisateurs/rôles, cumul possible)
- [x] 4.4 `services`
- [x] 4.5 `journal_audit`
- [x] 4.6 `grilles` / `domaines` / `normes` / `criteres` / `elements_mesurables`
- [x] 4.7 `sessions_evaluation` / `reponses` / `rapports_pdf`
- [x] 4.8 Contraintes (FK `organisation_id` partout, `UNIQUE` email/IFU, `UNIQUE` grille+version)
- [x] 4.9 Index multi-tenant (`organisation_id` composite sur toutes les tables scoped)
- [x] 4.10 Migration Prisma initiale (`20260917082241_init_tronc_commun_auto_evaluation`, appliquée sur `dps_bj`, client généré dans `apps/api/generated/prisma`)
- [x] 4.11 Seeders (`apps/api/prisma/seed.ts`, exécuté via `prisma db seed`) : compte admin plateforme + grilles EH/ESPC **placeholder** (1 domaine/1 norme/1 critère/2 éléments mesurables chacune) — ⚠️ à remplacer par le vrai référentiel du CDC avant mise en production
- [x] 4.12 Test de connexion TiDB Cloud (dev) — confirmé par l'application réussie de la migration

**Phase V2 — NEWS + EI + abonnements**
- [x] 4.13 `abonnements_module` — un abonnement par (organisation, module NEWS/EI), provisionné paresseusement (`ESSAI` créé à la première utilisation du module, pas à l'inscription)
- [ ] 4.14 `parametres_tarifaires` — pas encore nécessaire (aucune intégration paiement branchée sur les abonnements ; activation manuelle par l'admin en attendant KKiaPay, section 9/11.3)
- [x] 4.15 `patients` / `mesures_news` / `alertes` / `interventions` — + `utilisateurs.service_id` ajouté pour le filtrage par service (7.10)
- [x] 4.16 `types_ei` / `evenements_indesirables` / `evenement_transitions` / `causes` / `actions_correctives` / `pieces_jointes` — + `pieces_jointes.cloudinary_id` pour permettre la suppression côté Cloudinary
- [x] 4.17 Migration incrémentale — 3 migrations (`module_news_patients_alertes`, `utilisateur_service_affectation`, `module_ei`)
- [ ] 4.18 ❓ Seeders (types EI par défaut) — décision : **pas de seed de types EI par défaut**, ils sont créés à la demande par l'admin plateforme via `POST /types-ei` (comme testé en section 8) ; la durée d'essai par défaut (90j) est déjà en dur dans `AbonnementsService` et les seuils NEWS sont une échelle fixe (pas des données), donc rien d'autre à seeder ici

**Phase V3 — formations**
- [x] 4.19 `formations` / `reservations` / `factures`
- [ ] 4.20 ❓ Seed catalogue initial — décision : **pas de seed**, même logique que les types EI (4.18) : le catalogue est géré à la demande par l'admin plateforme via `POST /formations` (testé en section 9), pas de contenu figé à committer

## 5. Authentification — ✅ FAIT (backend), 2026-09-17

- [x] 5.1 Inscription Organisation (identité établissement + IFU + responsable) — `POST /auth/register/organisation`, transaction Organisation+Utilisateur+rôle RESPONSABLE_COMPTE
- [x] 5.2 Inscription Individuel — `POST /auth/register/individuel`
- [x] 5.3 Connexion (JWT) — `POST /auth/login`
- [x] 5.4 Déconnexion (invalidation refresh token) — `POST /auth/logout`, révocation en base (table `refresh_tokens`)
- [x] 5.5 Hachage mot de passe (bcrypt, 12 rounds)
- [x] 5.6 Gestion sessions/tokens (access JWT 15 min + refresh opaque 30 j en cookies httpOnly, rotation à chaque refresh)
- [x] 5.7 Mot de passe oublié — décision (CDC muet sur le sujet) : implémenté comme pratique standard. `POST /auth/forgot-password`, réponse identique que l'email existe ou non (pas de fuite d'information)
- [x] 5.8 Réinitialisation mot de passe — `POST /auth/reset-password`, token à usage unique (1h), révoque tous les refresh tokens existants de l'utilisateur
- [x] 5.9 Vérification email — ✅ FAIT le 2026-09-17, revenu sur la décision initiale de report à la demande explicite de l'utilisateur : **bloquant**, un compte non vérifié ne peut jamais se connecter (403 explicite, même avec le bon mot de passe). Flux : inscription → `EmailVerificationToken` (48h) créé + email envoyé, **pas de connexion automatique** (les endpoints `register/*` ne posent plus de cookies) → `GET /auth/verify-email?token=...` (lien cliqué depuis l'email) marque le compte vérifié et **redirige** (302) vers `WEB_APP_URL/login?verified=true|false` → l'utilisateur se connecte alors normalement. `POST /auth/resend-verification` pour renvoyer le lien (réponse générique, ne révèle pas si l'email existe). Design email : palette santé (blanc, bleu professionnel, touche de rose), mise en page email-safe par tableaux, dans `apps/api/src/notifications/templates/email-verification.template.ts` — **une première version sombre/or a été rejetée** (« montre que la plateforme est faite par l'IA ») et remplacée par cette palette. **Envoi réel testé et reçu.**
- [x] 5.10 Protection des routes — `JwtAuthGuard` global (NestJS, `@Public()` pour bypass) + `RolesGuard` (`@Roles(...)`) fait. **Middleware Next.js reste à faire** (section 10, frontend pas encore démarré)
- [x] 5.11 Gestion des rôles (cumul multi-rôle) — `UtilisateurRole[]` (table de jointure), `RolesGuard` autorise si au moins un rôle requis est présent
- [x] 5.12 Tests — 14 tests unitaires `auth.service.spec.ts` (inscription org/individuel, doublon IFU/email, connexion succès/échec/compte désactivé, rotation refresh token, token expiré/révoqué, forgot/reset password, token à usage unique) + smoke test manuel de bout en bout contre la vraie base TiDB (tous les flows). Tests d'isolation multi-tenant (RM7) et d'accès refusé hors rôle par les guards à ajouter quand les premiers endpoints métier existeront (section 6+).

Notes techniques :
- Client Prisma déplacé vers `apps/api/src/generated/prisma` (au lieu de `apps/api/generated/`) car `nest build` restreint `rootDir` à `src/` (`tsconfig.build.json`) — un output hors de `src/` casse le build. `generated/` ajouté au `.gitignore` racine (ne l'était pas avant, à vérifier qu'aucun commit n'existe déjà avec ce dossier).
- `main.ts` charge `dotenv/config` en tout premier — sans ça, `PrismaService` plante au démarrage (`process.env.DATABASE_URL` est `undefined` sous `nest start`, contrairement aux commandes `prisma` CLI qui chargent `.env` via `prisma7.config.ts`).
- Refresh tokens et tokens de reset mot de passe : valeur opaque aléatoire (32 octets), jamais un JWT — hashée en HMAC-SHA256 (clé `JWT_REFRESH_SECRET`) avant stockage, pour permettre la révocation côté serveur sans dépendre uniquement de l'expiration.

## 6. Module 1 — Auto-évaluation (gratuit) — ✅ Backend fait (sauf 6.8), 2026-09-17

- [x] 6.1 Sélection grille EH/ESPC — `GET /grilles` (filtre par type, réservé aux grilles PUBLIEE pour les non-admins) ; le type de grille est en plus validé contre `organisation.type` au démarrage de session
- [x] 6.2 Démarrage/reprise de session — `POST /sessions-evaluation` (démarrage), `GET /sessions-evaluation?statut=EN_COURS` (reprise), `GET /sessions-evaluation/:id` (détail + réponses déjà saisies)
- [x] 6.3 Affichage question par question + navigation — ✅ FAIT le 2026-09-17 (`apps/web/src/components/auto-evaluation/questionnaire.tsx`) : barre de progression collante en haut (% répondu), plan latéral par domaine (ancres), enregistrement à la volée par élément (`PUT` immédiat à chaque réponse, pas de bouton "sauvegarder" séparé)
- [x] 6.4 Enregistrement réponse (oui/non/texte/choix) — `PUT /sessions-evaluation/:id/reponses/:elementMesurableId`, upsert, rejeté (409) si la session est déjà soumise
- [x] 6.5 Soumission (verrouillage + calcul serveur du score, RM2/RM3) — `POST /sessions-evaluation/:id/soumettre`
- [x] 6.6 Consultation résultats (score global/domaine, écarts) — `GET /sessions-evaluation/:id/resultats` (recommandations textuelles pas encore générées, seulement la liste des critères non validés — à enrichir si besoin)
- [x] 6.7 Graphique d'évolution multi-sessions — `GET /sessions-evaluation/evolution` (données brutes ; le rendu graphique est frontend, section 10)
- [ ] 6.8 ❓ Génération PDF asynchrone (BullMQ + Puppeteer + Cloudinary) — **bloqué : aucune instance Redis provisionnée** (nécessaire à BullMQ). Décision à prendre : Redis local (poids supplémentaire sur une machine à 4 Go) vs service hébergé (Upstash/Redis Cloud, etc.). Non implémenté pour l'instant, le modèle `RapportPdf` existe déjà en base (section 4) et attend cette décision.
- [x] 6.9 Permissions (`responsable_compte`, `resp_qualite`) — `@Roles(...)` sur tout `SessionsEvaluationController`, `@Roles(ADMIN_PLATEFORME)` sur le CRUD grilles
- [x] 6.10 API (grilles, sessions, réponses) — rapports en attente de 6.8
- [x] 6.11 Interface (formulaire pas-à-pas, dashboard résultats) — ✅ FAIT le 2026-09-17 : liste des grilles disponibles (filtrées par type EH/ESPC de l'établissement) + sessions en cours/historique (`(app)/auto-evaluation`), questionnaire (voir 6.3), page résultats avec score par domaine et liste des écarts (`(app)/auto-evaluation/[id]/resultats`)
- [x] 6.12 Back-office admin (CRUD grilles, versionnage figé) — création/édition (tant que BROUILLON)/publication/archivage/nouvelle-version (clone) ; une grille PUBLIEE ou ARCHIVEE est immuable (RM3), toute évolution passe par `POST /grilles/:id/nouvelle-version`
- [x] 6.13 Tests — 7 tests unitaires `scoring.util.spec.ts` (RM1 exhaustif : critère invalidé si un seul élément négatif, critère sans réponse, critère sans élément, 100%) + smoke test réel de bout en bout contre TiDB (création grille → publication → session → réponses → soumission → score serveur correct → immuabilité post-soumission 409 → isolation multi-tenant RM7 404 → refus de rôle 403 pour un compte individuel). Non-régression du versionnage pas encore testée en pratique (endpoint `nouvelle-version` écrit mais pas exercé par le smoke test).

Notes techniques :
- Le score n'est **pas persisté par domaine/critère**, seulement `scoreGlobal` sur `SessionEvaluation` — le détail (`parDomaine`, `criteresNonValides`) est recalculé à la volée depuis les réponses stockées à chaque appel à `/resultats`. Choix délibéré pour éviter une dénormalisation prématurée ; à revisiter si la volumétrie l'exige.
- Règle de positivité d'un élément mesurable (RM1) pour les types `TEXTE`/`CHOIX` : **approximation** (non vide = positif), faute de règle explicite dans le CDC — voir commentaire dans `scoring.util.ts`. Seul `OUI_NON` (le seul type utilisé par les grilles placeholder) a une règle certaine (`valeur === true`).
- Isolation multi-tenant (RM7) : toute tentative d'accès à une session d'une autre organisation renvoie `404` (jamais `403`) pour ne pas révéler son existence — même pattern que le forgot-password de la section 5.

## 7. Module 2 — Score NEWS (essai 3 mois puis payant)

## 7. Module 2 — Score NEWS (essai 3 mois puis payant) — ✅ Backend fait (sauf 7.13), 2026-09-17

- [x] 7.1 Création fiche patient — `POST /patients`
- [x] 7.2 Clôture fiche patient (sortie, conservation historique) — `POST /patients/:id/cloturer` ; refuse toute nouvelle mesure une fois sorti (409)
- [x] 7.3 Saisie mesure (7 paramètres) — `POST /patients/:id/mesures`, validée (bornes physiologiques plausibles sur chaque paramètre)
- [x] 7.4 Calcul score + niveau de risque côté serveur — échelle **NEWS2 standard** (Royal College of Physicians), jamais fié à une valeur du client
- [x] 7.5 Déclenchement alerte automatique — une `Alerte` est créée dans la même transaction que la `MesureNews` dès que le niveau est MOYEN ou ELEVE (RM9)
- [x] 7.6 Notification (Brevo + in-app) — in-app = la ligne `Alerte` elle-même (visible via `GET /alertes`) ; Brevo = **stub** (`MailerService`, log uniquement, comme pour le mot de passe oublié en section 5), envoyé à tous les `resp_qualite`/`responsable_compte` de l'organisation
- [x] 7.7 Journal d'intervention — `POST /alertes/:id/interventions` (fait automatiquement passer l'alerte de OUVERTE à EN_COURS)
- [x] 7.8 Historique/courbe par patient — `GET /patients/:id/mesures` (données brutes triées par date ; le rendu graphique est frontend, section 10)
- [x] 7.9 Export fiche de surveillance — `GET /patients/:id/export` (JSON : fiche + mesures + alertes). **Pas de rendu PDF/impression formaté** — même famille de blocage que 6.8, reporté avec la décision Redis/PDF
- [x] 7.10 Permissions (`personnel_soignant`, filtrage par service) — `@Roles(PERSONNEL_SOIGNANT, RESP_QUALITE, RESPONSABLE_COMPTE)` sur tout le module ; `personnel_soignant` sans rôle de supervision est filtré sur son `service_id` (nouveau champ sur `Utilisateur`), les rôles de supervision voient tous les patients de l'organisation
- [x] 7.11 API (patients, mesures, alertes, interventions) — complète
- [x] 7.12 Interface (saisie rapide mobile/tablette, code couleur risque) — `(app)/news` (liste patients hospitalisés/historique + bandeau alertes ouvertes), `/news/nouveau`, `/news/[id]` (fiche + historique mesures + formulaire de saisie), `/news/alertes` + `/news/alertes/[id]` (interventions, transition de statut). Code couleur risque (`RisqueBadge`) cohérent avec la palette santé (vert bas/orange moyen/rouge élevé)
- [ ] 7.13 ❓ Back-office admin (seuils/fréquences de surveillance, supervision alertes multi-établissements) — **décision prise : reporté**. Les seuils NEWS2 sont une échelle clinique standard fixe, pas une donnée métier éditable — les rendre configurables par l'admin n'aurait pas de sens clinique sans une raison précise (ex. adapter à un protocole local). La supervision multi-établissements (vue admin transverse) reste à faire si le besoin se confirme.
- [x] 7.14 Scheduler quotidien d'expiration d'essai — `@nestjs/schedule`, cron quotidien à minuit (`ExpirationEssaisScheduler`), filet de sécurité en complément de la vérification paresseuse dans `AbonnementsService.verifierAcces`
- [x] 7.15 Tests — 44 tests unitaires `news-scoring.util.spec.ts` (chaque seuil des 7 paramètres NEWS2, y compris la règle du « red score » à 1 paramètre isolé à 3) + smoke test réel de bout en bout (mesure normale → score 0/BAS, mesure anormale → score 19/ELEVE, alerte auto-créée, notification déclenchée, intervention → passage EN_COURS, clôture, refus de régression de statut, clôture patient bloque les mesures suivantes, abonnement ESSAI provisionné automatiquement avec échéance à 90 jours)

## 8. Module 3 — Événements indésirables (essai 3 mois puis payant) — ✅ Backend fait (sauf 8.16), 2026-09-17

- [x] 8.1 Déclaration EI (fiche standardisée) — `POST /evenements-indesirables`
- [x] 8.2 File d'attente responsable qualité — `GET /evenements-indesirables/file-attente` (EI dont `gravite` est encore `null`)
- [x] 8.3 Qualification (gravité) — `PATCH /evenements-indesirables/:id/qualifier`. **Catégorie** = le `typeEiId` choisi à la déclaration (pas de champ catégorie séparé) ; **priorisation** pas implémentée en tant que champ dédié — la gravité + le tri par date dans la file d'attente en tiennent lieu pour l'instant
- [x] 8.4 Analyse des causes (immédiates/profondes) — `POST /evenements-indesirables/:id/causes`, append-only (pas d'update/delete exposés, par analogie avec RM4)
- [x] 8.5 Plan d'actions correctives (responsable + échéance) — `POST /evenements-indesirables/:id/actions-correctives`
- [x] 8.6 Suivi des actions (à_faire/en_cours/réalisée) — `PATCH /evenements-indesirables/:id/actions-correctives/:actionId`
- [x] 8.7 Clôture EI — transition vers `CLOTURE` (voir 8.8), horodate `dateCloture`
- [x] 8.8 Machine à états + historisation (RM8) — `DECLARE → EN_TRAITEMENT → CLOTURE`, transitions strictement croissantes (régression rejetée, 409), chaque transition écrite dans `evenement_transitions` (qui/quand/ancien→nouveau statut)
- [x] 8.9 Alerte gravité élevée — notification (stub Brevo, même mécanisme que NEWS) à `resp_qualite`/`responsable_compte` dès que `gravite = ELEVEE` ; **pas de table `Alerte` partagée avec NEWS** (celle-ci a `patientId`/`mesureId` non-nullables, spécifiques au module NEWS) — le mécanisme commun est le pattern notification, pas la table. Voir note technique plus bas.
- [x] 8.10 Tableau de bord — `GET /evenements-indesirables/tableau-de-bord` (total, répartition par statut/gravité/service, taux de clôture, délai moyen de clôture en jours)
- [x] 8.11 Export sur période donnée — `GET /evenements-indesirables/export?debut=&fin=`
- [x] 8.12 Lien optionnel vers critère auto-évaluation (RM10) — champ `critereId` optionnel à la déclaration, jamais lu par `calculerScore` (module 1) donc sans aucun effet sur le score
- [x] 8.13 Pièces jointes (upload Cloudinary) — `POST /evenements-indesirables/:id/pieces-jointes` (multipart, `FileInterceptor`), **testé avec un vrai upload/suppression sur le compte Cloudinary configuré** (pas un stub)
- [x] 8.14 Permissions (déclaration large, traitement `resp_qualite` uniquement) — déclaration/consultation ouvertes à tout compte organisation ; qualification/causes/actions/transitions/pièces jointes restreintes à `RESP_QUALITE`/`RESPONSABLE_COMPTE`
- [x] 8.15 API — complète
- [x] 8.16 Interface — `(app)/evenements-indesirables` (liste + filtre implicite non-qualifiés pour les rôles de traitement + accès tableau de bord), `/nouveau` (déclaration, ouverte à tout compte organisation), `/[id]` (qualification gravité, causes, actions correctives, transitions historisées, upload de pièce jointe, changement de statut — toutes ces actions masquées côté UI si le rôle n'est pas `RESP_QUALITE`/`RESPONSABLE_COMPTE`, en plus du contrôle déjà fait côté API), `/tableau-de-bord` (stats, redirige si rôle insuffisant). **Limite connue** : `responsableId` d'une action corrective est assigné à l'auteur de l'action lui-même — aucun endpoint API ne liste les membres de l'organisation pour permettre un vrai choix d'assigné (à ajouter si un module de gestion d'équipe voit le jour)
- [x] 8.17 Back-office admin — CRUD `TypeEi` (catalogue global, `GET/POST /types-ei` + désactivation/réactivation) par l'admin plateforme. **Échelle de gravité non paramétrable** (3 niveaux fixes FAIBLE/MODEREE/ELEVEE, choix délibéré de simplicité) ; **stats agrégées anonymisées multi-établissements** pas faites (le tableau de bord actuel est par organisation, pas une vue transverse admin) — à ajouter si le besoin se confirme
- [x] 8.18 Tests — smoke test réel de bout en bout contre TiDB (déclaration → file d'attente → qualification ELEVEE + notification → 2 causes → action corrective → transition EN_TRAITEMENT → action réalisée → clôture → historique des transitions vérifié → régression de statut rejetée 409 → tableau de bord correct) + upload/suppression réels sur Cloudinary. Pas de tests unitaires dédiés (contrairement aux modules 1/2) — la logique de transition est simple (une table d'ordre, comme `AlertesService`) et déjà exercée par le smoke test ; à ajouter si la machine à états se complexifie.

## 9. Module 4 — Formations (payant à l'unité) — ✅ Backend fait (sauf 9.11, 9.6 rappel), 2026-09-17

- [x] 9.1 Catalogue (liste + détail formation) — `GET /formations` (public, `@Public()`), `GET /formations/:id`
- [x] 9.2 Choix formule (individuel/groupe5/groupe10) — enum `FormuleFormation`, tarif par formule sur `Formation` (`prixIndividuel`/`prixGroupe5`/`prixGroupe10`)
- [x] 9.3 Paiement KKiaPay — `POST /reservations/:id/paiement/verifier` (le client transmet le `transactionId` obtenu du widget une fois le paiement effectué ; **le widget lui-même n'existe pas encore**, c'est un composant frontend, section 10)
- [x] 9.4 Confirmation « date sous 48h » — message envoyé (stub Brevo) dès la confirmation du paiement
- [x] 9.5 Fixation date RDV (admin) — `PATCH /reservations/:id/date-rdv`, seulement si `PAYEE` (sinon 409), fait passer à `CONFIRMEE`
- [x] 9.6 Notification date RDV — envoyée à la fixation de la date. **Rappel avant la session** pas implémenté (nécessiterait un scheduler périodique comparant `dateRdv` à la date du jour — pas fait faute de cas d'usage testable sans vraies réservations qui avancent dans le temps ; à ajouter avec `@nestjs/schedule`, déjà en place pour 7.14, le jour où le besoin se précise)
- [x] 9.7 Statuts réservation — `ATTENTE_PAIEMENT → PAYEE → CONFIRMEE → REALISEE`, ou `ANNULEE` depuis n'importe quel statut sauf `REALISEE`. Pas de machine à états stricte façon EI (pas de table de transitions historisées) — jugé non nécessaire ici, le CDC ne mentionne pas d'exigence d'audit équivalente à RM8 pour les réservations
- [x] 9.8 Facturation automatique — une `Facture` (numéro séquentiel `FAC-{année}-{6 chiffres}`) créée automatiquement dans la même transaction que le passage à `PAYEE`. **Pas de PDF de facture** — même blocage que 6.8/Redis
- [x] 9.9 Permissions (Organisation + Individuel) — tout compte non-admin peut réserver ; l'admin plateforme ne réserve pas mais gère le catalogue et les statuts (date RDV, réalisation)
- [x] 9.10 API — complète, y compris le webhook KKiaPay (`POST /paiements/kkiapay/webhook`)
- [ ] 9.11 ⏳ Interface (catalogue public + espace réservation) — **frontend, reporté à la section 10**. C'est aussi là que doit vivre le **widget KKiaPay** (`openKkiapayWidget`), sans lequel 9.3 ne peut pas être exercé de bout en bout
- [x] 9.12 Back-office admin (CRUD formations, gestion réservations, clôture session, suivi présences) — `POST/PATCH /formations` + désactivation, `PATCH /reservations/:id/date-rdv`, `POST /reservations/:id/realiser` (avec `presenceConfirmee`)
- [x] 9.13 Tests — smoke test réel de bout en bout contre TiDB (catalogue public sans auth, réservation avec tarif figé, **changement du prix catalogue après réservation vérifié sans effet sur le tarif déjà appliqué — RM5 confirmée**, isolation entre comptes individuels — 404, annulation, refus de fixer une date RDV sur une réservation non payée — 409) **+ appel réel contre l'API sandbox KKiaPay** (`POST /reservations/:id/paiement/verifier` avec un `transactionId` inexistant → rejet propre 400 « Transaction Not Found », confirmant que les clés/endpoints/en-têtes sont corrects) et **webhook testé avec signature valide/invalide** (toujours 200, signature invalide ignorée silencieusement, transaction sans réservation associée loguée). Pas de test du chemin de succès complet (paiement réellement accepté) — impossible sans le widget frontend qui génère un vrai `transactionId`.

## 10. Frontend transverse — ⏳ Démarré (fondations + auth + accueil faits), 2026-09-17

- [x] 10.1 Pages publiques — accueil, catalogue formations (données réelles depuis l'API), à propos. Design "santé" pro (blanc/bleu/rose, sans-serif Plus Jakarta Sans + Inter), animations `motion` (révélation au scroll, transitions de menu), SEO (`generateMetadata` par page, `sitemap.ts`, `robots.ts`, Open Graph)
- [x] 10.2 Authentification — inscription Organisation/Individuel, connexion, mot de passe oublié/réinitialisation, page "vérifiez votre email" avec renvoi — **testé en conditions réelles dans un vrai navigateur** (inscription individuel → email Brevo réellement envoyé → blocage de connexion avant vérification avec message d'erreur affiché)
- [x] 10.3 Dashboard établissement (statut par module) — `(app)/tableau-de-bord` : nom/type d'établissement, 4 cartes de module (auto-évaluation avec dernier score, NEWS/EI avec statut d'abonnement réel — essai/actif/expiré/non démarré —, formations). NEWS/EI mènent maintenant vers leurs interfaces réelles (voir 7.12/8.16)
- [x] 10.4 Navigation / garde de route — `proxy.ts` (⚠️ nommage v16, plus `middleware.ts`) redirige les routes protégées vers `/login` si non connecté (vérifié : 307 vers `/login?next=...`), et empêche l'accès aux pages d'auth une fois connecté. Prefixes protégés étendus à `/news` et `/evenements-indesirables`. Garde par rôle pour les actions de traitement EI faite au niveau composant (`aRole()` dans `lib/session.ts`, décodage JWT côté serveur sans revérification de signature — l'autorisation réelle reste imposée par l'API), pas au niveau `proxy.ts`
- [x] 10.5 Formulaires communs — questionnaire pas-à-pas de l'auto-évaluation (module 1), saisie de mesure NEWS + création patient + intervention (module 2), déclaration EI + qualification + causes + actions correctives + upload de pièce jointe (module 3) — tous sur le même patron `useActionState`/`useFormStatus`/`SubmitButton`
- [ ] 10.6 ⏳ Tableaux (patients, EI, réservations, utilisateurs) — pas commencé
- [ ] 10.7 ⏳ Filtres/recherche — pas commencé
- [ ] 10.8 ⏳ Pagination — pas commencé
- [ ] 10.9 ⏳ Modales — pas commencé
- [ ] 10.10 ⏳ Notifications in-app — pas commencé
- [ ] 10.11 ⏳ États loading/erreur — géré au cas par cas dans l'auth (erreurs de formulaire, `pending` via `useFormStatus`) ; pas de convention transverse (`loading.tsx`/`error.tsx`) posée encore
- [ ] 10.12 ❓ Responsive — classes Tailwind responsive appliquées partout (menu mobile avec bascule sur le header notamment), **mais pas confirmé visuellement** : l'outil d'automatisation navigateur n'a pas réussi à capturer un rendu à taille mobile dans cette session (voir note technique)
- [ ] 10.13 ⏳ Dashboard admin — pas commencé

Notes techniques :
- **Architecture auth frontend ↔ backend** : pas de proxy générique. Les Server Actions (`apps/web/src/lib/auth-actions.ts`) appellent l'API NestJS en serveur-à-serveur pour login/register/forgot/reset, puis **re-posent elles-mêmes** les cookies `access_token`/`refresh_token` sur l'origine Next.js (`session-cookies.ts`, via `Response.headers.getSetCookie()`) — les cookies de l'API (posés sur `localhost:3001`) ne sont jamais relayés tels quels au navigateur, qui ne connaît que l'origine Next.js. Les Server Components (lectures) utilisent `apiFetch`/`apiFetchJson` (`api-server.ts`) qui transmet le cookie `access_token` du visiteur à l'API. Décision délibérée pour rester mono-origine côté navigateur (pas de CORS, cohérent en dev comme en prod derrière un seul domaine).
- **Port 3000 indisponible sur cette machine** : un `mysqld.exe` local (sans rapport avec dps.bj, ne pas toucher) écoute déjà dessus. Le frontend est donc fixé sur le port **3002** (`next dev -p 3002` / `next start -p 3002` dans `package.json`), `WEB_APP_URL` (API) et `NEXT_PUBLIC_SITE_URL` (web) mis à jour en conséquence. L'API reste sur 3001.
- **Next.js 16 + React 19** : conventions vérifiées dans `node_modules/next/dist/docs/` avant d'écrire du code (version très récente, breaking changes vs. connaissances générales). Notables : `middleware.ts` → **`proxy.ts`**, `params`/`searchParams` sont des `Promise` à `await`, Cache Components (`use cache`) **volontairement pas activé** (`cacheComponents` absent de `next.config.ts`) pour rester sur le modèle de rendu classique — plus simple et moins risqué vu la taille du projet et la contrainte RAM ; à reconsidérer plus tard si le besoin de streaming granulaire se présente.
- **Pas de rafraîchissement silencieux de session** : `proxy.ts` fait une vérification optimiste par simple présence du cookie `access_token` (sa `maxAge` est alignée sur la durée de vie du JWT, 15 min) — après ce délai, redirection vers `/login`, pas de refresh automatique en tâche de fond. Amélioration possible plus tard (section 10.3+).
- **Outil d'automatisation navigateur (claude-in-chrome) — instable d'une session à l'autre** : fonctionne parfois après avoir ouvert un nouvel onglet frais (a marché ainsi lors de la construction de l'auth), mais lors de la construction du dashboard/auto-évaluation, **aucun onglet frais n'a fonctionné** (`navigate` rapporte un succès mais le contenu reste bloqué sur `chrome://newtab/`, y compris vers `example.com`) malgré plusieurs tentatives et la vérification qu'un seul navigateur est connecté. **Le rendu visuel du dashboard et du questionnaire n'a donc pas pu être confirmé à l'œil.** En compensation, toute la chaîne d'appels a été rejouée manuellement contre l'API réelle (`login` → `/organisations/me` → `/abonnements/:module` → `/grilles?type=` → `POST /sessions-evaluation` → `PUT .../reponses/:id` → `POST .../soumettre` → `GET .../resultats`), exactement dans l'ordre où le frontend les appelle, avec les mêmes types de réponse — score et résultats corrects obtenus. Reste donc non confirmé : uniquement le **rendu HTML/CSS/animations** (le `next build` valide déjà le typage et la génération des pages). À revérifier visuellement dès que l'outil redevient fiable.
- **Piège découvert** : `GET /abonnements/:module` renvoie un corps HTTP **vide** (`Content-Length: 0`, aucun `Content-Type`) quand l'abonnement n'existe pas encore (le contrôleur retourne `null`, Express ne sérialise pas ça en JSON `"null"`). `apiFetchJson` le lit alors comme une chaîne vide plutôt que `null` — sans planter (le composant `StatutAbonnementBadge` traite `""` comme "falsy", donc l'affichage reste correct), mais le typage TS (`AbonnementModule | null`) ne reflète pas exactement ce cas. Cohérent avec le comportement observé, pas un bug bloquant — à garder en tête si un futur endpoint qui peut renvoyer `null` est consommé ailleurs sans ce garde-fou naturel.
- **Nouvel endpoint backend** : `GET /organisations/me` (section "organisations", pas encore documentée ailleurs) — retourne l'organisation du compte connecté (404/403 si individuel ou admin sans organisation), nécessaire pour que le frontend sache filtrer les grilles par type d'établissement et afficher le nom de l'établissement.
- **Turbopack très lent au premier hit de chaque route sur cette machine** (jusqu'à 2-3 min par route non compilée, RAM oblige) — normal en dev, pas un bug. Le build de production (`next build`) fonctionne et prend ~1 min une fois le cache chaud.
- Bug corrigé en cours de route : `motion.button` avec les props HTML natives entières (`ComponentPropsWithoutRef<"button">`) provoque un conflit de types sur `onDrag`/`onAnimationStart`/etc. (signatures différentes entre motion et le DOM) — corrigé en excluant ces clés du type des props (`apps/web/src/components/ui/button.tsx`).
- **Garde par rôle côté frontend (NEWS/EI)** : `apps/web/src/lib/session.ts` décode le payload du JWT `access_token` (base64, **sans vérifier la signature**) pour savoir quels boutons/actions afficher (`obtenirSession()`, `aRole(...roles)`). Ce n'est qu'un confort d'affichage — l'API réimpose systématiquement `@Roles(...)` côté serveur, donc une falsification du payload décodé côté client n'ouvrirait aucune action réellement non autorisée.
- **Upload multipart depuis une Server Action** : `api-server.ts` ne force plus `Content-Type: application/json` quand `init.body instanceof FormData`, pour laisser `fetch` générer lui-même l'en-tête avec la bonne boundary — nécessaire pour `uploaderPieceJointeAction` (EI, pièces jointes).
- **Pas d'endpoint de liste des membres d'organisation** : à ce jour aucune route API ne permet de lister les utilisateurs d'une organisation (seul un utilisateur peut consulter `/organisations/me`). En conséquence, le formulaire d'action corrective EI assigne systématiquement l'action à son auteur (`responsableId` = utilisateur connecté) plutôt que d'offrir un vrai choix d'assigné — limite documentée, pas un oubli.
- `next build` (avec `NODE_OPTIONS=--max-old-space-size=1536`) et `tsc --noEmit` passent tous les deux sans erreur après l'ajout des interfaces NEWS/EI.

## 11. Intégrations

- [x] 11.1 **Cloudinary** — fait pour les pièces jointes EI (`CloudinaryService`, section 8.13) : upload et suppression réels vérifiés, validation type MIME (images/PDF/texte) et taille (10 Mo max) sur l'upload. **Reste à faire** : PDF rapports/factures (bloqué avec 6.8 sur la décision Redis), URLs signées (actuellement des URLs publiques Cloudinary standard, suffisant tant qu'il n'y a pas de données sensibles dans les pièces jointes — à revoir avant la prod)
- [x] 11.2 **Brevo** — ✅ intégration réelle (`BrevoService`, API transactionnelle v3 `/v3/smtp/email`, pas un stub) utilisée par `MailerService` pour les 4 notifications existantes (vérification email, reset mot de passe, alerte NEWS, alerte EI). Un échec d'envoi est toujours loggé mais jamais renvoyé à l'appelant (voir note technique). **Envoi réel confirmé de bout en bout** le 2026-09-17 (email de vérification effectivement reçu) après autorisation de l'IP de dev dans Brevo (`security/authorised_ips`) — aucune étape de validation d'expéditeur séparée n'a été nécessaire pour `houedonou.fils@gmail.com`. Templates : seul l'email de vérification a un design dédié (palette santé blanc/bleu/rose, voir 5.9) ; les 3 autres sont en HTML simple (non prioritaires selon la demande initiale).
- [x] 11.3 **KKiaPay** — configuration 3 clés ✅ (déjà en `.env`), vérification serveur systématique ✅ (`KkiapayService.verifierTransaction`, RM11, **appel réel testé contre l'API sandbox** — réponse cohérente sur transaction inexistante), webhook ✅ (signature `x-kkiapay-secret` vérifiée, idempotent, toujours 200). **Reste** : le widget front (§9.11/section 10) — sans lui, impossible de tester un paiement réellement accepté de bout en bout ; et confirmer que le hash secret du dashboard KKiaPay correspond bien à `KKIAPAY_SECRET` (hypothèse non vérifiable sans un vrai webhook reçu). Sandbox vs production : géré via `KKIAPAY_SANDBOX` (déjà `true` en dev) — le choix d'URL (dsp.sedjro.africa vs dps.bj) est un sujet de déploiement, section 13.

## 12. Tests (en continu, à chaque phase)

- [ ] 12.1 Tests unitaires des fonctions de scoring (NEWS §7.2, auto-évaluation §6.3)
- [ ] 12.2 Tests d'intégration par endpoint
- [ ] 12.3 Tests de permissions par rôle (matrice §1.5)
- [ ] 12.4 Tests d'isolation multi-tenant (RM7)
- [ ] 12.5 Tests E2E des parcours critiques (5 parcours identifiés)
- [ ] 12.6 Tests des intégrations externes (KKiaPay sandbox, Cloudinary, Brevo)
- [ ] 12.7 Tests de charge légers (saisie NEWS concurrente)
- [ ] 12.8 Tests de build production (web + api)

## 13. Déploiement

- [ ] 13.1 Environnement dev — dsp.sedjro.africa
- [ ] 13.2 Environnement prod — dps.bj
- [ ] 13.3 Variables d'environnement par environnement
- [ ] 13.4 Provisionnement TiDB Cloud (dev + prod)
- [ ] 13.5 Déploiement backend NestJS
- [ ] 13.6 Déploiement frontend Next.js
- [ ] 13.7 Configuration Cloudinary par environnement
- [ ] 13.8 Configuration Brevo (sender, templates)
- [ ] 13.9 Bascule KKiaPay sandbox → production
- [ ] 13.10 Domaine + HTTPS
- [ ] 13.11 Logs/monitoring
- [ ] 13.12 Sauvegardes TiDB
- [ ] 13.13 Vérification post-déploiement (smoke test des 4 modules)

---

## État global actuel (dernière mise à jour : 2026-09-17)

| Phase | Statut |
|---|---|
| 1. Analyse et préparation | ✅ Fait, sauf 1.11 (validation client en attente) |
| 2. Architecture | ✅ Fait, sauf 2.10 et 2.13 |
| 3. Initialisation du projet | ✅ Fait entièrement (credentials TiDB/Cloudinary/Brevo/KKiaPay configurés et testés) |
| 4. Base de données — Phase V1 + V2 + V3 | ✅ Fait entièrement (4.1–4.19) ; 4.14/4.18/4.20 (tarification séparée / seeds) explicitement non nécessaires par décision |
| 5. Authentification | ✅ Backend fait entièrement (5.1–5.12, y compris 5.9 vérification email bloquante), sauf le middleware Next.js (frontend pas démarré) |
| 6. Module 1 — Auto-évaluation | ✅ Backend fait, sauf 6.8 (PDF, décision prise : Redis hébergé type Upstash, credentials à fournir) et 6.3/6.11 (frontend, reporté section 10) |
| 7. Module 2 — Score NEWS | ✅ Backend + frontend faits (7.12), sauf 7.13 (back-office seuils, reporté par décision — voir section 7) |
| 8. Module 3 — Événements indésirables | ✅ Backend + frontend faits (8.16) |
| 9. Module 4 — Formations | ✅ Backend fait, sauf 9.11 (frontend + widget KKiaPay, reporté section 10) et le rappel avant session (9.6, pas de cas d'usage testable pour l'instant) |
| 10. Frontend transverse | ⏳ Démarré — auth + accueil + catalogue formations (testés en navigateur réel) + dashboard établissement + module 1 auto-évaluation complet (build OK, **non testé visuellement** cette fois, outil navigateur indisponible) ; interfaces NEWS/EI/formations, tableaux, filtres, responsive confirmé restent à faire |
| 11 à 13 | ⏳ Non démarré |

## Contrainte opérationnelle importante : RAM limitée (~4 Go)

La machine de développement ne dispose que d'environ 4 Go de RAM. `npm install` complet et `next build` peuvent échouer par manque de mémoire (OOM), surtout si d'autres applications tournent en parallèle. Constaté à plusieurs reprises le 2026-09-16.
Bonnes pratiques à appliquer pour la suite :
- Fermer les applications lourdes (navigateur, IDE) avant tout `npm install`/`build` complet
- Préférer `NODE_OPTIONS=--max-old-space-size=1024` (ou 1536) sur les commandes lourdes pour transformer un kill OS en erreur JS diagnosticable
- Éviter de lancer plusieurs commandes Node lourdes en parallèle
- En cas de blocages répétés malgré tout ça, un redémarrage de la machine purge les processus zombies plus efficacement que fermer les apps une à une

## Identifiants configurés (valeurs réelles dans les `.env`, jamais dans ce fichier ni dans git)

- **TiDB Cloud** : cluster `gateway01.eu-central-1.prod.aws.tidbcloud.com:4000`, base `dps_bj`, connexion confirmée via Prisma → `apps/api/.env`
- **Cloudinary** : cloud_name `dg9fitya` → `apps/api/.env` + `apps/web/.env.local`
- **Brevo** : clé API en place, **email expéditeur encore à valider/renseigner**
- **KKiaPay** : clés sandbox en place (publique/privée/secrète)
- Gabarits sans secret disponibles dans `apps/api/.env.example` et `apps/web/.env.example`

## Prochaine étape

**Le backend (auth + 4 modules métier) est fait. Le frontend a maintenant un parcours complet construit** : accueil, catalogue, auth, dashboard établissement, module 1 (auto-évaluation) de bout en bout (sélection grille → questionnaire → soumission → résultats).

**À rattraper dès que possible** : le dashboard et le module auto-évaluation construits le 2026-09-17 ont été vérifiés au niveau logique/API (toute la séquence d'appels rejouée avec succès contre le vrai backend, voir note technique section 10) mais **pas visuellement** — l'outil claude-in-chrome était indisponible ce jour-là. Un test visuel rapide (inscription org → vérification email réelle → connexion → tableau de bord → démarrer une auto-évaluation → répondre → soumettre → résultats) reste à faire dès que l'outil redevient fiable, pour rattraper le rendu HTML/CSS/animations.

**Suite ensuite** : les interfaces NEWS et EI (formulaires de saisie), ou le widget KKiaPay pour les formations — au choix.

Ajout hors-plan du 2026-09-17 : vérification email (5.9) implémentée et **envoi réel Brevo confirmé** (email reçu) après autorisation de l'IP de dev dans Brevo — voir section 5 et 11.2 pour le détail.

**En attente côté utilisateur** : décision prise d'héberger Redis via un service type Upstash pour débloquer 6.8/génération PDF — il reste à créer le compte et fournir l'URL de connexion (`REDIS_URL` ou équivalent) quand ce sera fait ; pas bloquant pour la suite.

Notes techniques pour la suite :
- Le client Prisma MySQL v7 utilise l'adaptateur `@prisma/adapter-mariadb` (+ `mariadb`), déjà installé. **TiDB Cloud impose TLS** et le pilote `mariadb` ne comprend pas `?sslaccept=strict` (spécifique à mysql2) : la config TLS explicite avec le CA est centralisée dans `apps/api/src/prisma/create-tidb-adapter.ts`, utilisée par `PrismaService` (injectable NestJS, module global) et par `apps/api/prisma/seed.ts`.
- Le client Prisma est généré dans `apps/api/src/generated/prisma` (et non `apps/api/generated/`) — nécessaire pour que `nest build` fonctionne (`tsconfig.build.json` restreint `rootDir` à `src/`). Ce dossier est gitignoré.
- Auth : `JwtAuthGuard` protège toutes les routes par défaut (utiliser `@Public()` pour les endpoints ouverts), `@Roles(...)` + `RolesGuard` pour restreindre par rôle. `@CurrentUser()` récupère le payload JWT (`{ sub, typeCompte, organisationId, serviceId, roles }`) dans un contrôleur — utile pour le scoping `organisation_id` systématique exigé par RM7 et le filtrage par service (7.10).
- Les grilles EH/ESPC actuellement en base sont des **placeholders** (4.11) — le vrai contenu du CDC reste à intégrer avant la mise en production du module 1, mais suffisant pour développer/tester le moteur de sessions.
- Pattern d'isolation multi-tenant établi en sections 6/7 (`GrillesService`/`SessionsEvaluationService`/`PatientsService`/`AlertesService`) : toujours scoper les requêtes avec `organisationId` tiré du JWT (`@CurrentUser()`), jamais du body/params envoyés par le client ; répondre `404` (pas `403`) sur un accès hors-tenant.
- `AbonnementsService.verifierAcces(organisationId, module)` est générique (enum `ModuleMetier` = `NEWS | EI`) — réutilisé tel quel par le module EI (section 8) pour son propre essai/abonnement.
- Score NEWS : échelle **NEWS2 standard** (pas une donnée CDC spécifique, contrairement aux grilles d'auto-évaluation) — implémentée dans `apps/api/src/patients/news-scoring.util.ts`, seuils fixes et non éditables par l'admin (décision section 7.13).
- Upload de fichiers (Nest + Multer) : `Express.Multer.File` n'était pas résolu par défaut car `tsconfig.json` restreint `types` à une liste explicite (`vitest/globals`, `node`) — il a fallu y ajouter `"multer"`. À garder en tête pour toute future dépendance qui compte sur une augmentation de type globale (`declare global`) plutôt que sur un export normal.
- `MailerService` envoie réellement via `BrevoService` (§11.2, fait le 2026-09-17) pour ses 4 usages : vérification email, reset mot de passe (section 5), alerte NEWS (section 7), alerte EI gravité élevée (section 8). Chaque appel est enveloppé (`envoyerSansEchouer`) pour qu'un échec d'envoi ne fasse jamais échouer l'action métier déjà accomplie (inscription, alerte...) — seulement loggé bruyamment ; le rattrapage passe par un renvoi explicite (`resend-verification`) plutôt qu'un retry automatique.
- **Blocage Brevo rencontré puis levé** : `401 unrecognised IP address` (Brevo restreint l'accès API par IP) — résolu en autorisant l'IP de dev dans `security/authorised_ips`. Aucune validation d'expéditeur séparée n'a été nécessaire dans ce cas précis.
- Email de vérification : token opaque (comme reset password), 48h, usage unique. Lien construit avec `API_URL` (nouvelle variable d'env, pointe sur le backend lui-même — distincte de `WEB_APP_URL` qui est le frontend) car c'est un lien cliqué depuis un client mail, hors SPA.
- Connexion bloquée si `emailVerifieLe` est `null` — vérifié **après** le mot de passe (ne pas aider un attaquant à distinguer un compte non vérifié d'un mauvais mot de passe). Le compte admin seedé (4.11) est marqué vérifié automatiquement (provisionné par la plateforme, pas via l'inscription publique).
- Pas de table `Alerte` partagée entre NEWS et EI : celle de NEWS a `patientId`/`mesureId` non-nullables. Le « mécanisme commun » de RM9 est le pattern de notification (`MailerService` + recherche des `resp_qualite`/`responsable_compte` de l'organisation), pas une table unique — à revisiter seulement si un vrai besoin de vue unifiée des alertes (NEWS + EI) apparaît.
- `@kkiapay-org/nodejs-sdk` (npm) exporte `verify()`/`refund()` via une fonction `kkiapay({publickey, privatekey, secretkey, sandbox})` — jette une simple `Error` (pas une exception HTTP typée) en cas d'échec, à toujours capturer explicitement (voir `ReservationsService.verifierPaiement`) sous peine de 500 générique au lieu d'un 400 propre.
- RM5 concrètement : le tarif est figé **à la création de la réservation** (pas au moment du webhook/confirmation), car en pratique le paiement suit immédiatement via le widget. Vérifié par smoke test : changer le prix catalogue après coup n'affecte pas une réservation déjà créée.
