# Roadmap de mise en conformité DSP ↔ cahier des charges (CDC v0.2)

Source unique : les écarts constatés dans `RAPPORT_CONFORMITE_CDC.md` (30/09/2026). Aucune fonctionnalité ajoutée hors de ces écarts.
Cycle par étape : **analyse → implémentation → tests → vérification de non-régression → mise à jour de cette roadmap → rapport d'étape** (en bas du fichier, section « Journal des étapes »).

Légende : `[ ]` à faire · `[~]` en cours · `[x]` fait et testé · `[!]` bloqué sur une donnée/décision client (jamais inventée).

## Règles de travail

1. Rien d'inventé : quand le CDC ne précise pas un point, l'option la plus prudente est retenue **et écrite ici** (« Décision »).
2. Données que seul le client possède → `[!]`, le reste est construit autour (ex. : écran prêt, contenu à saisir par l'admin).
3. Isolation par organisation (RM7) conservée partout : l'`organisationId` vient toujours du jeton, jamais du client.
4. Chaque étape se termine par des tests. Tests e2e contre la base TiDB **de développement** uniquement, données préfixées et nettoyées.
5. Contrainte machine (~4 Go de RAM) : commandes lourdes lancées une par une, avec `NODE_OPTIONS=--max-old-space-size=…`.

---

## Phase 1 — Comptes, utilisateurs internes, services (§4.1, §4.2)

- [x] **1.1** Services de l'établissement : CRUD `services` par `RESPONSABLE_COMPTE` (scopé à son organisation) + écran.
- [x] **1.2** Utilisateurs internes : création par le `RESPONSABLE_COMPTE` (nom, prénom, civilité, email, rôles parmi RESP_QUALITE / PERSONNEL_SOIGNANT / GESTIONNAIRE_FORMATION / RESPONSABLE_COMPTE, service optionnel), liste, modification des rôles et du service, désactivation/réactivation + écran.
  - Décision : l'utilisateur interne choisit **lui-même** son mot de passe via un lien d'activation envoyé par email (même mécanisme que la réinitialisation). Le responsable ne connaît jamais le mot de passe (« mot de passe personnel », §4.2, §13.2).
- [x] **1.3** Inscription Organisation complète : raison sociale, type d'établissement (hôpital, clinique, laboratoire, pharmacie, cabinet médical, autre), ville, pays, email et téléphone de l'établissement, civilité du responsable, IFU = exactement 13 chiffres (API + formulaire).
- [x] **1.4** `GESTIONNAIRE_FORMATION` effectif : accès au module Formation de son établissement (réservations de l'organisation).

## Phase 2 — Module NEWS (§7, §12.3, §13)

- [x] **2.1** Fiche patient minimale : identifiant interne (obligatoire), service, n° de lit ; plus aucune donnée d'identité exigée. Nom/prénom/date de naissance/sexe retirés des formulaires et de l'API.
  - Décision : les colonnes d'identité déjà en base sont conservées en **nullable** pour ne pas détruire les données existantes, mais ne sont plus ni saisies ni affichées.
- [x] **2.2** Fréquence de surveillance suggérée par niveau de risque (12 h / 4–6 h / continue), affichée à la saisie et sur la fiche.
- [x] **2.3** Paramétrage admin des seuils de niveau de risque et des fréquences de surveillance (§12.3, §13.5), versionné sans modifier les mesures déjà enregistrées.
- [!] **2.4** Grille par paramètre : le code applique NEWS2 ; le tableau du CDC diffère sur FR 9–11, oxygène d'appoint et température > 40. **Décision client requise.**
- [x] **2.5** Export / impression de la fiche de surveillance (patient + mesures + alertes + interventions).
- [x] **2.6** Alerte vers le « personnel désigné » : destinataires = soignants du service du patient + responsables qualité / du compte (email). La notification in-app pour les utilisateurs d'établissement est traitée en 6.1.
- [x] **2.7** Correction tracée d'une mesure (horodatée, motif, auteur ; la mesure d'origine reste consultable) (§13.4).
- [x] **2.8** Journalisation de la création et de la clôture de fiche patient (§13.2) ; liste des alertes filtrée par service pour le personnel soignant.

## Phase 3 — Module Événements indésirables (§8, §12.4)

- [x] **3.1** Fiche de déclaration complète : date et heure de survenue, service ou lieu, type, description, gravité, personnes impliquées ou témoins (obligatoire), critère lié (optionnel).
- [x] **3.2** Machine à 5 états : déclaré → qualifié → en analyse → plan d'action → clôturé, chaque transition historisée.
- [x] **3.3** Qualification : confirmation de la gravité et du type, priorité.
- [x] **3.4** Analyse des causes en champs guidés (méthode des « 5 pourquoi » : immédiates / profondes).
- [x] **3.5** Choix du responsable d'une action parmi les membres de l'établissement (contrôle d'appartenance côté API).
- [x] **3.6** Clôture seulement si toutes les actions sont réalisées.
- [x] **3.7** Alerte immédiate dès la déclaration d'un EI de gravité élevée (+ direction = `RESPONSABLE_COMPTE`).
- [x] **3.8** Tableau de bord par typologie ; export par période dans l'interface.
- [x] **3.9** Échelle de gravité paramétrable par l'admin (§12.4).
- [x] **3.10** Correction tracée de la fiche EI (motif, horodatage) (§13.4).
- [!] **3.11** « Réception envoyée à la zone sanitaire ou au ministère » (§8.2) : destinataires et canal non définis par le CDC. **Décision client requise.**

## Phase 4 — Module Auto-évaluation (§6)

- [x] **4.1** Type d'élément mesurable (document à examiner / entretien / observation) + « entre dans le score » ; calcul du score limité aux documents à examiner.
- [x] **4.2** Questionnaire « une question à la fois », navigation précédente / suivante, plan latéral, reprise.
- [x] **4.3** Résultats : liste des documents non validés + recommandation par critère (texte saisi par l'admin dans la grille).
- [x] **4.4** EI liés à un critère affichés dans les résultats et le rapport (§8.4).
- [x] **4.5** Rapport PDF de synthèse généré en tâche asynchrone (file d'attente en base), notification « rapport disponible » (§6.4, §6.6, §11.2).
- [x] **4.6** Vue admin comparative de la conformité par établissement (§6.5) + historique des évaluations dans la fiche établissement.
- [!] **4.7** Contenu officiel des grilles ARS EH et ESPC : **à fournir par le client** (l'éditeur admin permet de le saisir).

## Phase 5 — Abonnements, paiements, facturation (§5, §10.4, §10.5, §11.1)

- [x] **5.1** Paramètres tarifaires en base (prix NEWS, prix EI, durée d'essai, comportement de fin d'essai : lecture seule ou blocage) + écran admin.
- [x] **5.2** Comportement de fin d'essai appliqué uniformément à toutes les écritures des modules NEWS et EI.
- [x] **5.3** Souscription NEWS / EI par l'établissement via KKiaPay (vérification serveur) ; tableau de bord avec jours restants et accès direct à la souscription.
- [x] **5.4** Webhook KKiaPay capable de rattacher une transaction à sa réservation ou son abonnement (paiement tardif).
- [x] **5.5** Factures : réservation ou abonnement, devise (XOF), PDF téléchargeable, historique des transactions.
- [x] **5.6** Admin : activer, suspendre, prolonger un essai ou un abonnement (écran) ; statut des modules dans la liste des établissements.

## Phase 6 — Notifications (§11.2)

- [x] **6.1** Notifications in-app pour tous les utilisateurs (pas seulement l'admin), visibles dans l'espace personnel.
- [x] **6.2** Email de confirmation d'inscription (après vérification).
- [x] **6.3** Rappel avant expiration d'un essai.
- [x] **6.4** Rappel avant une session de formation.
- [x] **6.5** Découplage : les alertes NEWS / EI passent par un événement métier écouté par un gestionnaire de notification (§7.5, §8.5).

## Phase 7 — Tableau de bord administrateur (§12)

- [x] **7.1** Fiche établissement détaillée : historique des évaluations, alertes, EI (agrégés), formations réservées.
- [x] **7.2** Contact WhatsApp de l'établissement (lien vers son numéro).
- [x] **7.3** Statistiques par période et évolution de l'activité dans le temps ; établissements actifs par module.
- [x] **7.4** Formations : champ « objectifs » ; suivi des présences.
- [x] **7.5** `Organisation.actif` effectif (un établissement suspendu ne peut plus se connecter).

## Phase 8 — Finitions et mise en service (§10.6, §13)

- [x] **8.1** Marque DSP dans les emails.
- [x] **8.2** Suppression du script temporaire contenant un mot de passe en clair.
- [!] **8.3** Déploiement recette `dsp.sedjro.africa` puis production : **accès serveur à fournir par le client**.

---

## Journal des étapes

*(un rapport par étape, ajouté au fil de l'avancement)*

### Phase 1 — Comptes, utilisateurs internes, services — TERMINÉE (30/09/2026)

**Ce qui a été fait**
- Migration `20260930183256_conformite_p1_comptes_services`, purement additive :
  - `organisations` : `raison_sociale`, `type_structure`, `ville`, `pays` ;
  - `utilisateurs` : `civilite` ;
  - `services` : `actif`.
- **1.1 Services** (module API `equipe`, écran `/organisation/services`) :
  - `GET/POST/PATCH /organisation/services`, `POST …/desactiver|reactiver` ;
  - lecture ouverte à tout membre, écriture réservée au responsable du compte ;
  - un service n'est jamais supprimé, seulement désactivé.
- **1.2 Utilisateurs internes** (écran `/organisation/equipe`) :
  - `GET/POST/PATCH /organisation/membres`, désactivation/réactivation, renvoi d'invitation ;
  - rôles attribuables : responsable du compte, responsable qualité, personnel soignant, gestionnaire formation (jamais admin plateforme) ;
  - mot de passe personnel : le membre reçoit un lien d'activation (72 h, page `/activer-compte`) et choisit lui-même son mot de passe. La réinitialisation marque désormais l'email comme vérifié ;
  - garde-fous : le responsable ne peut ni se désactiver, ni retirer son propre rôle de responsable. Une désactivation révoque immédiatement les sessions ;
  - toutes les actions sont écrites dans le journal d'audit.
- **1.3 Inscription §4.1** :
  - raison sociale, type d'établissement (liste du CDC + « Autre »), ville, pays, email et téléphone de l'établissement, civilité du responsable ;
  - IFU = exactement 13 chiffres (API + formulaire) ;
  - « Mon établissement » permet de modifier ces champs.
  - Libellés corrigés selon le glossaire du CDC : EH = Établissement hospitalier, ESPC = Établissement de soins de premiers contacts (l'ancien libellé ESPC était faux).
- **1.4 Gestionnaire formation** :
  - dans un compte Organisation, réserver et consulter les réservations est réservé au responsable du compte et au gestionnaire formation (contrôle dans `ReservationsService`) ;
  - comptes individuels inchangés ;
  - navigation filtrée selon les rôles (auto-évaluation, NEWS, réservations, établissement).

**Décisions (le CDC ne tranche pas)**
- Déclaration d'EI laissée ouverte à tout membre : le §8.1 dit « toute personne habilitée ».
- Le catalogue partagé des permissions (`@dps/shared`), non utilisé par les contrôleurs concernés, n'a pas été modifié.

**Tests**
- Unitaires API : `src/auth` 40/40, dont le nouveau `register-organisation.dto.spec.ts` (IFU, champs obligatoires) et l'activation d'un compte invité.
- E2E nouveaux : `equipe-organisation.e2e-spec.ts` 16/16, `formation-acces-roles.e2e-spec.ts` 3/3.
  - Couvert : isolation entre établissements (404), rôles, invitation → activation → connexion, révocation des sessions, services désactivés.
- Non-régression : suite e2e complète **13 fichiers, 93/93**.
- `tsc --noEmit` API et web : OK.
- **Non fait :** `next build` (à lancer en fin de phase 2), et aucune vérification visuelle en navigateur.


### Phase 2 — Module NEWS — TERMINÉE (01/10/2026), sauf 2.4 (décision client)

**Ce qui a été fait**
- Migration `conformite_p2_news` :
  - `patients.identifiant_interne` (obligatoire) et `numero_lit` ; nom et prénom deviennent facultatifs en base ;
  - `mesures_news.frequence_surveillance` ;
  - table `corrections_mesures_news` ;
  - 5 paramètres NEWS insérés.
  - Les 3 fiches patients déjà présentes en base ont reçu un identifiant interne repris du n° de dossier, ou `ANCIEN-<fin d'id>` à défaut.
- **2.1 Fiche minimale (§7.1, §3.3)** :
  - l'API n'accepte plus que l'identifiant interne, le service et le lit (tout autre champ → 400) ;
  - elle ne renvoie jamais les anciennes colonnes d'identité (sélection explicite `SELECTION_PATIENT`) ;
  - service vérifié comme appartenant à l'établissement et actif. Avant, un service d'un autre établissement était accepté sans contrôle ;
  - identifiant unique parmi les patients hospitalisés ;
  - les écrans (liste, fiche, alertes, tableau de bord, cloche) affichent « Patient <identifiant> · lit <n> ».
- **2.2 Fréquence de surveillance suggérée** : figée sur chaque mesure, affichée dans l'historique et sur la fiche. Rappel des seuils sous le formulaire de saisie.
- **2.3 Paramétrage admin (§12.3)** :
  - `news_seuil_moyen` / `news_seuil_eleve` (défaut 5 / 7 = CDC) et les 3 fréquences (défaut = exemples du CDC), modifiables dans `/admin/parametres` ;
  - cohérence vérifiée (seuil moyen < seuil élevé) ;
  - une modification ne s'applique qu'aux mesures suivantes (§13.5).
  - La règle « un paramètre isolé à 3 → risque moyen » reste toujours appliquée (texte du CDC).
- **2.5 Fiche de surveillance (§7.4)** :
  - page imprimable `/news/[id]/fiche` (mesures, corrections, alertes, interventions avec auteurs ; « enregistrer en PDF » via l'impression du navigateur) ;
  - export CSV de l'historique des mesures.
- **2.6 Personnel désigné** : email aux soignants du service du patient + responsables qualité + responsable du compte. L'email ne contient plus le nom du patient.
- **2.7 Correction tracée (§13.4)** :
  - `PATCH /patients/:id/mesures/:mesureId` avec motif obligatoire ;
  - valeurs avant/après, auteur et date conservés ; score recalculé côté serveur ;
  - alerte créée si le risque devient moyen ou élevé ; une alerte existante n'est jamais supprimée.
- **2.8** :
  - création et clôture de fiche journalisées (`patient.creer`, `patient.cloturer`) ;
  - liste des alertes et accès à une fiche filtrés par service pour un soignant rattaché à un service.

**Décisions**
- Les colonnes d'identité existantes ne sont pas supprimées : aucune donnée n'est détruite, mais elles ne sont plus jamais exposées.
- **2.4 reste bloqué** : le tableau du CDC et l'échelle NEWS2 appliquée par le code diffèrent sur 3 valeurs. Il faut une décision client.

**Tests**
- Unitaires NEWS : 51/51, dont 4 nouveaux sur les seuils paramétrés.
- Nouvel e2e `news-conformite.e2e-spec.ts` : 11/11 (champs d'identité refusés, isolation par service, fréquence et paramétrage, destinataires d'alerte, correction tracée, export, audit).
- Données de test du fichier `multi-tenant.e2e-spec.ts` adaptées (patient créé avec un identifiant interne).
- Non-régression e2e complète : **14 fichiers, 104/104**.
- `tsc` API et web : OK.
- **Non fait :** `next build`, et aucune vérification visuelle.

### Phase 3 — Module Événements indésirables — TERMINÉE (01/10/2026), sauf 3.11 (décision client)

**Ce qui a été fait**
- Migration `20261001090000_conformite_p3_ei`, écrite à la main pour reprendre les données. Après application, `prisma migrate diff` ne détecte plus aucun écart entre la base et le schéma.
  - Nouvelle table `niveaux_gravite_ei`, initialisée avec l'échelle donnée en exemple par le CDC : incident sans conséquence, incident avec conséquence mineure, événement indésirable grave et décès. Les deux derniers sont marqués « critiques ».
  - Les 6 types d'EI cités par le CDC sont pré-remplis ; l'administrateur reste libre de les modifier.
  - Reprise des données existantes :
    - ancienne gravité FAIBLE / MODÉRÉE / ÉLEVÉE → niveaux 1 / 2 / 3 ;
    - date de survenue inconnue → date de déclaration ;
    - personnes impliquées → mention « Non renseigné (déclaration antérieure…) » ;
    - statut EN_TRAITEMENT → EN_ANALYSE ;
    - EI encore « déclaré » mais déjà doté d'une gravité → QUALIFIÉ.
- **3.1 Fiche §8.1** : date et heure de survenue (ni dans le futur), service ou lieu (l'un des deux est obligatoire), type, description, gravité, personnes impliquées ou témoins (obligatoire) et critère d'auto-évaluation lié, proposé à partir de la grille publiée de l'établissement.
- **3.2 Circuit** : déclaré → qualifié → en analyse → plan d'action → clôturé. Chaque passage n'avance que d'une étape, et est historisé avec son auteur.
- **3.3 Qualification** : confirmation de la gravité et du type, priorité (haute, normale, basse) ; la file d'attente affiche les plus graves en premier.
- **3.4 Analyse des causes** : méthode guidée des « 5 pourquoi » puis cause retenue, possible uniquement en analyse ou en plan d'action. Il faut au moins une cause pour passer au plan d'action.
- **3.5 Responsable d'une action** : choisi parmi les membres actifs de l'établissement. Il est désormais contrôlé côté API ; avant, n'importe quel identifiant était accepté.
- **3.6 Clôture** : impossible tant qu'il n'y a pas au moins une action et qu'elles ne sont pas toutes réalisées. Elle est journalisée (`ei.cloturer`).
- **3.7 Alerte immédiate** : email au responsable qualité et à la direction (responsable du compte) dès la déclaration d'un EI de niveau critique, ou à la qualification si la gravité est relevée.
- **3.8 Tableau de bord** : répartition par typologie, gravité, service et statut ; export CSV par période de survenue depuis l'interface.
- **3.9 Échelle de gravité** : gérée par l'administrateur dans `/admin/types-ei`. Un niveau déjà utilisé ne peut pas être modifié (réponse 409) : on le désactive et on en crée un nouveau (§13.5).
- **3.10 Correction tracée** : `PATCH /evenements-indesirables/:id/corriger` avec motif obligatoire. Seuls les champs réellement modifiés sont conservés, avec leurs valeurs avant et après ; l'historique est affiché sur la fiche.
- Écrans adaptés : déclaration, détail (circuit, formulaires par étape), liste et vues, tableau de bord, cloche d'alertes, statistiques et centre d'alertes admin.

**Décisions**
- Les priorités BASSE, NORMALE et HAUTE sont la représentation minimale de la « priorisation » du §8.2, que le CDC ne détaille pas.
- La déclaration anonyme (§8.5, phrase incomplète dans le CDC) n'est pas mise en place : le déclarant reste obligatoire.
- **3.11 reste bloqué** : la transmission à la zone sanitaire ou au ministère demande de savoir à qui et par quel canal envoyer. Il faut une décision client.

**Tests**
- Nouvel e2e `ei-conformite.e2e-spec.ts` : 12/12 (champs obligatoires, alerte à la déclaration, file d'attente, qualification, circuit strict, causes guidées, responsable, clôture conditionnée et journalisée, correction tracée, tableau de bord et export par période, échelle de gravité admin).
- Données de test du fichier `alertes-analytics-…e2e-spec.ts` adaptées au nouveau modèle : 18/18. *Correction : une première version de ce rapport indiquait 13 et 17 ; le total exécuté (30) était juste, la répartition non.*
- `tsc` API et web : OK.

### Phase 4 — Module Auto-évaluation — TERMINÉE (01/10/2026), sauf 4.7 (contenu client)

**Ce qui a été fait**
- Migration `20261001120000_conformite_p4_auto_evaluation`, purement additive :
  - `type_element` et `entre_dans_score` sur les éléments mesurables ;
  - `categorie` et `recommandation` sur les critères ;
  - `contenu`, `tentatives` et `erreur` sur les rapports PDF.
  - Les éléments existants deviennent des « documents à examiner » qui entrent dans le score : les scores déjà calculés ne changent pas. Les évaluations déjà soumises sont mises en file d'attente pour obtenir leur rapport.
- **4.1** : seuls les éléments « entre dans le score » comptent. Par défaut, c'est le cas d'un document à examiner, pas d'un entretien ni d'une observation. L'éditeur de grilles admin gère la nature de l'élément, la participation au score, la catégorie et la recommandation.
- **4.2** : questionnaire une question à la fois, avec boutons Précédente et Suivante, passage automatique à la suivante après une réponse Oui/Non, plan latéral par domaine (compteur de réponses), barre de progression, reprise sur la première question sans réponse, récapitulatif avant soumission. Les champs texte sont enregistrés à la sortie du champ, et non plus à chaque frappe.
- **4.3** : les résultats listent les documents non validés de chaque critère, distinguent « Non » de « sans réponse » et affichent une recommandation. C'est celle saisie par l'admin ; à défaut, la liste des documents à fournir, déduite des réponses.
- **4.4** : les EI de l'établissement rattachés à un critère en écart apparaissent dans les résultats et dans le rapport PDF, sans effet sur le score.
- **4.5** : à la soumission, le rapport est placé dans une file d'attente en base, dans la même transaction. Une tâche passe toutes les 30 secondes (`RapportsPdfService`), génère le PDF avec `pdfkit` et le stocke en base. Après 3 échecs, le rapport passe en ECHEC. Le téléchargement est authentifié (`GET /sessions-evaluation/:id/rapport.pdf`, avec contrôle d'appartenance) ; il n'y a aucune URL publique. Une notification est envoyée par email et dans l'application aux responsables.
- **4.6** : nouvelle page admin `/admin/conformite` : dernier score par établissement et par grille, évolution par rapport au précédent, export CSV. Un onglet « Évaluations » a été ajouté à la fiche admin de l'établissement.

**Décisions**
- Pas de serveur Redis : la file d'attente du §6.6 repose sur la table `rapports_pdf` et une tâche planifiée déjà présente dans le projet (`@nestjs/schedule`).
- Le PDF est stocké en base plutôt que sur Cloudinary, pour éviter une URL publique vers des données de conformité.
- Un critère qui ne contient aucun document à examiner est compté au total sans être validé. C'est la règle existante ; le CDC ne traite pas ce cas.
- Dépendance ajoutée : `pdfkit` (et `@types/pdfkit`). npm audit ne signale aucune alerte sur `pdfkit` lui-même. En revanche, des alertes existaient déjà sur d'autres dépendances, dont `next` 16.2.0-16.3.5 en sévérité **critique** : à traiter en phase 8.
- **4.7 reste bloqué** : le contenu officiel des grilles ARS EH et ESPC doit être fourni par le client.

**Tests**
- Unitaires : scoring 10/10 (dont 3 nouveaux sur les documents à examiner) ; total API 101/102 au premier passage complet. L'échec est un délai de 10 s dépassé dans le `beforeEach` de `auth.service.spec.ts` sous charge ; seul, le fichier passe à 20/20.
- Nouvel e2e `auto-evaluation-conformite.e2e-spec.ts` : 6/6 (grille typée, score, documents non validés, recommandation, EI liés, génération réelle du PDF par la file, en-tête `%PDF-`, notifications, isolation (404), vue admin).
- `tsc` API et web : OK.
- Non-régression e2e complète des phases 1 à 4 et `next build` : voir l'entrée suivante.

### Non-régression des phases 1 à 4 (01/10/2026)
- Suite e2e complète : **16 fichiers, 122/122**.
- `next build` (phases 1 à 4) : **non validé**.
  - Une première tentative a été interrompue par moi : des fichiers web avaient été modifiés pendant le build.
  - Les tentatives suivantes échouent sur une **erreur d'environnement Windows** (`0xc0000142`, échec de création d'un processus Node par Turbopack pour PostCSS sur `globals.css`), et non sur une erreur de code.
  - Le typage (`tsc --noEmit`) du frontend passe à chaque phase.
  - Voir l'entrée « Build web » plus bas pour la suite.

### Phase 5 — Abonnements, paiements, facturation — TERMINÉE (01/10/2026)

**Ce qui a été fait**
- Migration `20261001150000_conformite_p5_abonnements_paiements`. Après application, `prisma migrate diff` ne détecte aucun écart. Elle ajoute :
  - le statut `SUSPENDU` ;
  - `expire_le` (date d'expiration du §7.5) ;
  - la table `paiements_abonnement` ;
  - une facture rattachée soit à une réservation, soit à un paiement d'abonnement, avec sa devise ;
  - 4 paramètres tarifaires.
- **5.1 Paramètres tarifaires (§10.5)** : prix de l'abonnement NEWS, prix de l'abonnement EI, durée d'un abonnement et comportement de fin d'essai, modifiables dans `/admin/parametres` avec validation. La durée d'essai existait déjà.
- **5.2 Fin d'essai** :
  - une garde commune (`@ModuleAbonne`) est posée sur tous les contrôleurs NEWS (patients, alertes) et EI : un GET est une lecture, tout le reste est une écriture ;
  - module expiré : en LECTURE_SEULE, la consultation est possible et l'écriture refusée (403) ; en BLOCAGE, tout est refusé ;
  - module suspendu : tout est refusé ;
  - l'ancien contrôle, qui ne portait que sur la création de patient, la saisie de mesure et la déclaration d'EI, est remplacé par cette règle uniforme.
- **5.3 Souscription** :
  - le responsable du compte souscrit depuis `/abonnements` : tarif et durée sont figés sur la demande, puis le paiement passe par le widget KKiaPay et est vérifié côté serveur (statut et montant, RM11) ;
  - l'abonnement devient ACTIF jusqu'à la date d'expiration ; si un abonnement est encore en cours, la nouvelle période s'ajoute à sa fin ;
  - le tableau de bord établissement affiche les jours restants et un lien vers la souscription ;
  - la tâche quotidienne fait aussi expirer les abonnements arrivés à échéance.
- **5.4 Webhook** : le widget transmet `partnerId` = `RES-<id>` ou `ABO-<id>`. D'après la documentation KKiaPay (« Webhook »), ce champ est renvoyé tel quel au webhook. Le webhook revérifie la transaction auprès de KKiaPay puis confirme la réservation ou l'abonnement : le cas du paiement finalisé après la fermeture de la page est couvert.
- **5.5 Factures** :
  - module `factures` : numérotation commune `FAC-AAAA-NNNNNN` et devise (XOF) ;
  - historique des factures (`GET /factures`, page `/factures`) et PDF téléchargeable, généré à la demande depuis la facture enregistrée, avec contrôle d'appartenance ;
  - lien vers la facture depuis le détail d'une réservation et depuis l'historique des paiements d'abonnement.
- **5.6 Administration** :
  - activer, prolonger, suspendre et reprendre un abonnement, depuis la fiche admin de l'établissement ; chaque action est journalisée ;
  - statut des modules dans la liste des établissements.
- Notification « paiement confirmé » : email et notification in-app au responsable du compte.

**Décisions**
- Le CDC ne donne aucun prix ni durée d'abonnement. Les valeurs initiales sont donc à 0, ce qui signifie « non paramétré » : la souscription reste indisponible tant que l'administrateur ne les a pas saisies. Aucun tarif n'a été inventé.
- Comportement de fin d'essai par défaut : LECTURE_SEULE, conformément à la formulation du §5 (« accès restreint/lecture seule »). Il est modifiable.
- Les abonnements activés manuellement avant cette phase n'ont pas de date d'expiration : ils restent actifs tant que l'admin ne les modifie pas.

**Tests**
- Nouvel e2e `abonnements-paiements.e2e-spec.ts` : 11/11. KKiaPay y est remplacé par un faux, car un paiement réellement accepté ne peut pas être produit en test automatique. Le test couvre :
  - l'offre non paramétrée et la validation des paramètres ;
  - la souscription par rôle ;
  - le refus d'une transaction inconnue, d'un montant différent ou d'un autre établissement ;
  - l'activation sur 30 jours, la facture et son PDF ;
  - l'isolation des factures ;
  - le webhook pour un abonnement et pour une réservation (signature obligatoire) ;
  - la lecture seule et le blocage ;
  - les actions admin journalisées ;
  - l'expiration quotidienne.
- `tsc` API et web : OK.
- **Non testé :** un vrai paiement en sandbox avec le widget (il faut une transaction réelle).

### Build web des phases 1 à 5 (01/10/2026)
- `next build` (Turbopack, le bundler par défaut) échoue deux fois de suite sur une erreur d'environnement Windows : `0xc0000142`, Turbopack n'arrive pas à créer le processus Node qui exécute PostCSS pour `globals.css`. Ce fichier n'a pas été modifié dans cette session.
- `next build --webpack` **réussit** : compilation en 10,7 min, **61 pages générées**, dont toutes les nouvelles routes des phases 1 à 5 (équipe, services, activation, fiche imprimable, factures, abonnements, conformité…).
- Conclusion : le code compile en production. L'échec sous Turbopack est propre à cette machine (4 Go de RAM). À revérifier sur le serveur de recette.

### Phase 6 — Notifications (§11.2, §7.5, §8.5) — TERMINÉE (01/10/2026)

**Ce qui a été fait**
- **6.5** : nouveau module `evenements-metier`, un bus d'événements interne. Les modules NEWS et EI **publient** les événements `news.alerte` et `ei.gravite-elevee`. Un gestionnaire séparé (`NotificationsListener`) envoie les emails et crée les notifications in-app. La publication est asynchrone : l'enregistrement d'une mesure ou d'un EI ne dépend plus de l'envoi des notifications.
- **6.1** : chaque événement du §11.2 crée aussi une notification in-app pour ses destinataires :
  - alerte NEWS (personnel désigné), EI de gravité élevée (responsable qualité et direction) ;
  - rapport PDF disponible, paiement d'abonnement, paiement de formation, date de RDV ;
  - rappels, inscription confirmée.
  La cloche de notifications, avec relevé régulier et « marquer lu », existait seulement côté admin ; elle est maintenant dans l'espace établissement et l'espace individuel.
- **6.2** : après la vérification de l'adresse email, envoi d'un email « inscription confirmée » et d'une notification de bienvenue.
- **6.3** : tâche quotidienne à 8 h (heure de Porto-Novo) : rappel au responsable du compte avant la fin d'un essai. Délai paramétrable (`delai_rappel_essai_jours`, 7 par défaut). Envoi unique, remis à zéro si l'essai est prolongé.
- **6.4** : rappel avant une session de formation confirmée. Délai paramétrable (`delai_rappel_formation_jours`, 2 par défaut). Envoi unique.
- Migration `20261001180000_conformite_p6_notifications` : 2 colonnes « rappel envoyé le » et 2 paramètres ; aucune dérive après application.

**Décisions**
- Le CDC ne fixe pas de délai pour les rappels : 7 et 2 jours par défaut, modifiables par l'admin.
- Pas de nouvelle dépendance (Redis ou bibliothèque d'événements) : le bus repose sur l'`EventEmitter` de Node et la planification sur `@nestjs/schedule`, déjà présents.

**Tests**
- Nouvel e2e `notifications-conformite.e2e-spec.ts` : 5/5 (inscription confirmée ; alerte NEWS en email et in-app, visible par le soignant ; EI grave ; rappel de fin d'essai envoyé une seule fois ; date de RDV et rappel de formation).
- Les tests NEWS et EI attendent désormais la fin des traitements asynchrones avant de vérifier les envois : 11/11 et 12/12. Auth unitaire : 40/40.
- `tsc` API et web : OK. Non-régression des phases 1 à 6 : **18 fichiers, 138/138**.

### Phase 7 — Tableau de bord administrateur (§12) — TERMINÉE (01/10/2026)

**Ce qui a été fait**
- **7.1 Fiche établissement** :
  - onglet « Alertes & EI » : alertes NEWS comptées par niveau et par statut, EI comptés par statut, sans aucune donnée patient ni description d'EI ;
  - onglet « Formations » : réservations de l'établissement ;
  - onglets « Évaluations » (phase 4) et « Modules et abonnements » (phase 5).
- **7.2** : lien « Contacter l'établissement » via WhatsApp (`wa.me`, numéro au format international). Le format international est indiqué dans le formulaire d'inscription.
- **7.3** :
  - `GET /analytics/activite?debut&fin` : sur la période, nombre d'établissements inscrits, d'évaluations soumises, d'alertes NEWS, d'EI déclarés et de réservations, avec leur série mois par mois. Les 12 derniers mois par défaut ;
  - établissements par module et par statut ;
  - nouvelle section de la page Analytics : filtre de période, chiffres clés et graphique d'évolution.
- **7.4** :
  - champ « objectifs » des formations : formulaire admin et fiche publique, avec la mention « dispensée en présentiel » ;
  - clôture de session avec le nombre de participants présents (au plus la taille de la formule, 400 au-delà) et colonne « Présents » dans le tableau admin.
- **7.5** : un établissement désactivé ne peut plus se connecter (403 « accès suspendu »), ni rafraîchir sa session. Ses sessions en cours sont fermées immédiatement.
- Migration `20261001210000_conformite_p7_admin` : `formations.objectifs` et `reservations.participants_presents` ; aucune dérive.

**Tests**
- Nouvel e2e `admin-conformite.e2e-spec.ts` : 4/4 (objectifs et présences, fiche détaillée sans donnée individuelle, activité par période réservée à l'admin, désactivation effective puis réactivation).
- `tsc` API et web : OK.

### Phase 8 — Finitions et mise en service — 8.1 et 8.2 TERMINÉES, 8.3 bloquée (01/10/2026)

**Ce qui a été fait**
- **8.1** : emails à la marque DSP (sujets, texte, en-tête du modèle de vérification, nom d'expéditeur par défaut). Dans `apps/api/.env`, la seule ligne `BREVO_SENDER_NAME` passe de « dps.bj (dev) » à « DSP (dev) » ; `.env.example` est mis à jour.
- **8.2** : suppression de `apps/api/prisma/temp-visual-check-setup.ts`. Ce script non versionné contenait un mot de passe admin en clair, et son en-tête indiquait « à supprimer après usage » ; il n'était référencé nulle part.
  - **Action à faire de ton côté** : s'il a été exécuté lors d'une session précédente, le mot de passe du compte admin est toujours la valeur qu'il contenait. Il faut le changer.
- **Sécurité des dépendances** :
  - `next` 16.3.5 → **16.3.8** (et `eslint-config-next`). Cela corrige l'alerte critique GHSA-vcvr-r3jv-pc5j, une exécution de code à distance dans `next/og`, même si le projet n'utilise pas `next/og`.
  - Risques résiduels **non corrigés**, faute de correctif compatible :
    - `mariadb` 3.4.5, imposé exactement par `@prisma/adapter-mariadb` 7.10. Une surcharge vers 3.5.4 a été essayée puis annulée, car le lockfile maintenait la 3.4.5. Il faudra mettre à jour l'adaptateur Prisma dès qu'une version le corrigera.
    - `axios` 0.27, embarqué par `@kkiapay-org/nodejs-sdk` : le SDK ne propose pas de version corrigée.
    - `deepmerge-ts`, via Prisma : npm ne propose comme correction qu'une régression vers Prisma 6, ce qui n'a pas été fait.
- **8.3 bloqué** : le déploiement en recette (`dsp.sedjro.africa`) puis en production demande un accès serveur que seul toi peux fournir.

**Tests de non-régression finale (phases 1 à 8)**
- Suite e2e complète : **19 fichiers, 142/142** (exit 0).
- `next build --webpack` avec `next` 16.3.8 : **réussi** (Next.js 16.3.8, compilé en 9,2 min, 61/61 pages générées, exit 0).

---

## Bilan après mise en conformité (01/10/2026)

Établi à partir des écarts du `RAPPORT_CONFORMITE_CDC.md` et des rapports d'étape ci-dessus. Seul ce qui a été réellement implémenté **et testé** est marqué ✅.

| § CDC | Avant | Après | Reste |
|---|---|---|---|
| 4.1 Inscription Organisation | 🟡 | ✅ | — |
| 4.2 Utilisateurs internes, rôles, services | ❌ | ✅ | — |
| 5 Abonnements, essai, fin d'essai | 🟡 | ✅ | Prix et durée à saisir par l'admin |
| 6.1 Grilles EH / ESPC | 🟡 | 🟡 | **Contenu officiel ARS à fournir (4.7)** |
| 6.2 Une question à la fois | ⚠️ | ✅ | — |
| 6.3 Score sur les documents à examiner | 🟡 | ✅ | — |
| 6.4 Documents non validés, recommandations, PDF | ❌ | ✅ | Recommandations à saisir dans les grilles officielles |
| 6.5 Historique, vue admin comparative | 🟡 | ✅ | — |
| 6.6 Version figée, score serveur, PDF asynchrone | 🟡 | ✅ | — |
| 7.1 Fiche patient minimale | ⚠️ | ✅ | — |
| 7.2 Grille NEWS | ⚠️ | ⚠️ | **Décision client : tableau du CDC ou NEWS2 (2.4)** |
| 7.3 Saisie, couleurs, fréquence, alerte, interventions | 🟡 | ✅ | — |
| 7.4 Courbe, export et impression | 🟡 | ✅ | — |
| 7.5 Points d'implémentation NEWS | 🟡 | ✅ | — |
| 8.1 Fiche EI | ❌ | ✅ | — |
| 8.2 Circuit de traitement | 🟡 | 🟡 | **Transmission zone sanitaire / ministère : décision client (3.11)** |
| 8.3 Tableau de bord, alertes, export | 🟡 | ✅ | — |
| 8.4 Lien EI ↔ critère | 🟡 | ✅ | — |
| 8.5 Machine à états, historisation, notification commune | 🟡 | ✅ | Déclaration anonyme non retenue (phrase du CDC incomplète) |
| 9 Formations | 🟡 | ✅ | — |
| 10.4 KKiaPay (vérification, webhook) | 🟡 | ✅ | Paiement sandbox réel à valider avec le widget |
| 10.5 Paramètres tarifaires | ❌ | ✅ | Valeurs à saisir |
| 10.6 Environnements | ❌ | ❌ | **Accès serveur à fournir (8.3)** |
| 11.1 Facturation | 🟡 | ✅ | — |
| 11.2 Notifications | 🟡 | ✅ | — |
| 12.1 à 12.6 Administration | 🟡 | ✅ | — |
| 13.1 Isolation | ✅ | ✅ | — |
| 13.2 Sécurité d'accès | 🟡 | ✅ | Vérification de l'IFU limitée au format (13 chiffres) et à l'unicité |
| 13.3 Disponibilité | ❌ | ❌ | Dépend du déploiement |
| 13.4 Immuabilité, corrections tracées | 🟡 | ✅ | — |
| 13.5 Évolutivité | 🟡 | ✅ (sauf grille NEWS, voir 7.2) | — |

**La plateforme est-elle prête ?** Fonctionnellement, presque tout le CDC est couvert et testé. Une **mise en production** reste conditionnée par quatre éléments qui ne dépendent pas du code :
1. le contenu officiel des grilles ARS EH et ESPC (4.7) ;
2. la décision sur la grille NEWS (2.4) ;
3. la décision sur la transmission des EI à la zone sanitaire ou au ministère (3.11) ;
4. l'accès au serveur de recette puis de production (8.3), où il faudra aussi :
   - valider un paiement KKiaPay réel en sandbox ;
   - valider l'affichage dans un navigateur, ce qui n'a pas été fait dans cette session ;
   - saisir les tarifs.
