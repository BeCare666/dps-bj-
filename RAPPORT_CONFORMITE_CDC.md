# Rapport de conformité : plateforme DSP vs cahier des charges (CDC v0.2)

Date de l'analyse : 30/09/2026
Référence : `CAHIER_DE_CHARGES.md` (CDC fonctionnel v0.2, 16 sections)
Périmètre analysé : `apps/api` (backend), `apps/web` (frontend), `packages/shared`, `apps/api/prisma` (schéma, migrations, seed), `ROADMAP.md`.

---

## 0. Méthode et limites (à lire en premier)

**Ce qui a été fait :**
- Le CDC a été lu en entier, section par section.
- Chaque exigence a été comparée au **code réel** : schéma Prisma, DTO, services, contrôleurs, pages et composants. Les affirmations de `ROADMAP.md` n'ont **pas** été prises pour acquises. Quand la roadmap et le code divergent, c'est le code qui fait foi (voir §5).
- Aucune ligne de code n'a été modifiée (ni web, ni API). Le seul fichier créé est ce rapport.

**Ce qui n'a PAS été fait (donc non vérifié par moi) :**
- Aucun test e2e lancé : ils écrivent dans la vraie base TiDB de dev.
- Aucun `build` lancé (contrainte RAM de la machine).
- Aucune vérification visuelle dans un navigateur.
- Aucun paiement KKiaPay réel.
- Tests unitaires lancés : résultat au §6.

**Exclusions demandées :**
- Le nom de la plateforme : DSP remplace « dps.bj ».
- Les technologies (§10.1 à 10.3 du CDC : Laravel/Vue/PostgreSQL remplacés par NestJS/Next.js/MySQL-TiDB). Elles ne sont **pas** comptées comme des écarts.
- KKiaPay est traité comme une **exigence fonctionnelle** (paiement), pas comme une techno.

**Légende :**
- ✅ Conforme : fait et correspond au CDC.
- 🟡 Partiel : fait en partie, ou fait autrement que le CDC le décrit.
- ❌ Non fait : absent du code.
- ⚠️ Divergent : fait, mais contredit une règle écrite du CDC.

---

## 1. Verdict global

**La plateforme n'est pas prête pour la production, et ne répond pas encore entièrement au cahier des charges.**

**Ce qui marche :**
- Le socle est solide : authentification, isolation des données par établissement, rôles, back-office admin.
- Les quatre modules existent de bout en bout (API + écrans).

**Ce qui bloque :**
- Plusieurs exigences **structurantes** du CDC sont absentes ou divergentes.
- Des éléments indispensables à une mise en service réelle manquent.

**Les 10 blocages majeurs :**

1. **Aucune création d'utilisateurs internes par l'établissement (§4.2).** Il n'existe aucun endpoint ni écran pour qu'un établissement ajoute des infirmiers, médecins ou responsables qualité. Dans les faits, un compte Organisation = un seul utilisateur. Or les modules NEWS et EI reposent sur un usage multi-personnel.
2. **Aucune création de services (§4.2, §7.1).** La table `services` existe, mais rien dans le code ne permet d'y ajouter un service (maternité, urgences…). Conséquences : le filtrage par service et les statistiques par service sont inopérants.
3. **Grilles EH/ESPC officielles absentes (§6.1).** Seules deux grilles *placeholder* existent (1 domaine / 1 critère / 2 questions, `prisma/seed.ts`). Le vrai référentiel ARS n'est pas intégré.
4. **Pas de rapport PDF (§6.4, §6.6)**, pas de recommandations par critère en écart, et pas d'interface « une question à la fois » (§6.2).
5. **Abonnements payants inexistants (§5, §10.5, §11.1).** Aucun prix d'abonnement, aucun paiement d'abonnement NEWS/EI, aucun écran de souscription. Un établissement dont l'essai a expiré ne peut pas payer.
6. **Fiche patient non conforme (§7.1, §3.3).** Le code **exige nom et prénom** du patient, et accepte date de naissance et sexe. Le CDC demande une fiche minimale *sans données d'identité complètes* (identifiant interne, service, n° de lit). Le numéro de lit n'existe pas.
7. **Grille NEWS différente du tableau du CDC (§7.2)** sur 3 points (voir §3.3).
8. **Fiche EI incomplète (§8.1).** Manquent :
   - la date et l'heure de survenue ;
   - les personnes impliquées ou témoins (pourtant *obligatoire*) ;
   - la gravité à la déclaration ;
   - le service dans le formulaire.

   Le circuit compte 3 statuts au lieu des 5 du CDC (§8.2, §8.5).
9. **Notifications incomplètes (§11.2).** Manquent :
   - le rappel avant expiration d'essai ;
   - le rappel avant une session de formation ;
   - l'avis « rapport PDF disponible » ;
   - les notifications visibles dans l'espace de l'utilisateur. L'in-app n'existe que pour l'admin.
10. **Rien n'est déployé (§10.6).** Pas d'environnement de recette ni de production, pas de configuration de déploiement dans le dépôt.

---

## 2. Tableau de synthèse par section du CDC

| § CDC | Sujet | Statut |
|---|---|---|
| 3.2 / 3.3 / 14 | Positionnement (pas un DPI, saisie manuelle, pas de certification) | 🟡 (la fiche patient stocke nom et prénom, voir 7.1) |
| 4.1 | Compte Organisation, inscription | 🟡 |
| 4.2 | Utilisateurs internes, rôles, service | ❌ (rôles définis, mais création d'utilisateurs et de services absente) |
| 4.3 | Compte Individuel | ✅ |
| 4.4 | Administrateur plateforme | ✅ (espace dédié ; contenu partiel, voir §12) |
| 5 | Accès et abonnements par module | 🟡 (essai OK ; payant, souscription et lecture seule absents) |
| 6.1 | Grilles EH / ESPC éditables par l'admin | 🟡 (éditeur OK ; référentiel officiel absent) |
| 6.2 | Questionnaire guidé une question à la fois | ⚠️ (toutes les questions sur une seule page) |
| 6.3 | Calcul du score | 🟡 (règle OK ; distinction « document à examiner » absente) |
| 6.4 | Résultats + recommandations + PDF | 🟡 / ❌ |
| 6.5 | Historique + vue admin comparative | 🟡 |
| 6.6 | Points d'implémentation (version figée, score serveur, PDF asynchrone) | 🟡 |
| 7.1 | Fiche patient minimale | ⚠️ |
| 7.2 | Grille NEWS | ⚠️ (3 écarts) |
| 7.3 | Saisie, code couleur, fréquence, alerte, interventions | 🟡 |
| 7.4 | Courbe + export/impression fiche | 🟡 |
| 7.5 | Points d'implémentation NEWS | 🟡 |
| 8.1 | Fiche de déclaration EI | ❌ / 🟡 (plusieurs champs obligatoires absents) |
| 8.2 | Circuit de traitement | 🟡 |
| 8.3 | Tableau de bord et alertes EI | 🟡 |
| 8.4 | Lien EI ↔ critère d'auto-évaluation | 🟡 (API seulement) |
| 8.5 | Points d'implémentation EI | 🟡 |
| 9.1 / 9.2 | Réservation formation + statuts | ✅ / 🟡 |
| 9.3 | Tarif figé au paiement | ✅ |
| 10.4 | Paiement KKiaPay (vérif. serveur + webhook) | 🟡 |
| 10.5 | Paramètres tarifaires modifiables par l'admin | ❌ (seule la durée d'essai l'est) |
| 10.6 | Environnements test / production | ❌ |
| 11.1 | Facturation | 🟡 (numéro de facture ; pas de PDF, pas d'abonnements) |
| 11.2 | Notifications email + espace personnel | 🟡 |
| 12.1 | Admin : établissements et abonnements | 🟡 |
| 12.2 | Admin : grilles | ✅ |
| 12.3 | Admin : NEWS (seuils + supervision alertes) | 🟡 |
| 12.4 | Admin : EI (types, gravité, stats anonymisées) | 🟡 |
| 12.5 | Admin : formations | ✅ / 🟡 |
| 12.6 | Admin : statistiques globales | 🟡 |
| 13.1 | Confidentialité / isolation | ✅ |
| 13.2 | Sécurité d'accès | 🟡 |
| 13.3 | Disponibilité 24/7 | ❌ (non déployé) |
| 13.4 | Immuabilité / correction tracée | 🟡 |
| 13.5 | Évolutivité / versionnage | 🟡 |
| 15 | Périmètre V1 | ❌ (même le module Auto-évaluation seul n'est pas complet) |

---

## 3. Détail exigence par exigence

### 3.1 Profils et comptes (§4)

**§4.1 Inscription Organisation**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Nom et raison sociale | Seul `nom` existe (`Organisation.nom`). Pas de champ raison sociale. | 🟡 |
| Type d'établissement (hôpital, clinique, laboratoire, pharmacie, cabinet…) | **Absent.** Le champ `type` ne contient que `EH`/`ESPC`, c'est-à-dire la catégorie ARS. | ❌ |
| Catégorie ARS EH / ESPC | `Organisation.type` (enum `EH`/`ESPC`) | ✅ |
| IFU 13 chiffres | Unicité vérifiée (`@unique`). Format **non vérifié** : `@MinLength(3)` seulement (`register-organisation.dto.ts`), aucun contrôle « 13 chiffres ». | 🟡 |
| Coordonnées : email, téléphone, ville, pays | `email`/`telephone`/`adresse` existent dans le modèle. **Ville et pays absents.** Le formulaire web ne propose que l'adresse, pas l'email ni le téléphone de l'établissement (`register-organisation-form.tsx`). | 🟡 |
| Responsable : nom, prénom, **civilité**, email, mot de passe | Nom, prénom, email, mot de passe : OK. **Civilité absente** du modèle `Utilisateur`. | 🟡 |

**§4.2 Utilisateurs internes**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Le compte Organisation crée des utilisateurs internes | **Aucun endpoint de création d'utilisateur.** `UtilisateursController` est réservé à `ADMIN_PLATEFORME` ; le commentaire du code indique que `USERS_CREATE` est « volontairement absent ». Aucune page côté établissement. | ❌ |
| Identifiant et mot de passe personnels | Oui pour le seul compte existant (bcrypt, JWT). | ✅ (mais voir ligne 1) |
| Rôles : Responsable du compte, Responsable qualité, Personnel soignant, Gestionnaire formation | Les 4 rôles existent (enum `RoleUtilisateur`). L'admin peut ajouter ou retirer un rôle (`POST/DELETE /utilisateurs/:id/roles`). **`GESTIONNAIRE_FORMATION` ne donne accès à rien** : il n'apparaît que dans le catalogue `packages/shared`, aucun contrôleur ne l'autorise. | 🟡 |
| Personnel soignant = accès NEWS **uniquement** | NEWS : OK. EI : **tout compte organisation peut déclarer et consulter la liste des EI**, soignant compris (`EvenementsIndesirablesController.declarer`/`lister`, sans `@Roles`). Ça peut se défendre (le CDC dit « toute personne habilitée peut déclarer »), mais ça ne correspond pas au texte strict du §4.2. | 🟡 |
| Rattachement optionnel à un service | Le champ `Utilisateur.serviceId` existe. **Aucun moyen de créer un service ni d'affecter un utilisateur à un service** : aucune écriture sur la table `services` dans tout le code. | ❌ |

**§4.3 et §4.4**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| §4.3 Individuel limité aux formations | `POST /auth/register/individuel`. Pas d'organisation, donc refus (403) sur auto-évaluation, NEWS et EI. | ✅ |
| §4.4 Espace d'administration | `(admin)/admin/*` : 20 pages. Le contenu est détaillé au §3.7. | ✅ |

### 3.2 Modèle d'accès et d'abonnement (§5, §10.5)

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Auto-évaluation gratuite et permanente | Aucun contrôle d'abonnement sur `sessions-evaluation`. | ✅ |
| NEWS : essai 3 mois à partir de l'activation | `AbonnementsService.verifierAcces` crée un essai à la **première utilisation**. La durée vient de `ParametrePlateforme.duree_essai_module_jours` (90 par défaut). | ✅ |
| Puis passage automatique en payant (ou lecture seule, « à confirmer ») | À expiration, le statut passe à `EXPIRE` (tâche planifiée à minuit + contrôle à chaque accès). **Aucun passage en payant n'est possible** : ni prix, ni paiement d'abonnement, ni endpoint de souscription. Le blocage ne s'applique qu'à certaines écritures : création de patient, saisie de mesure, déclaration d'EI. Les autres actions (qualifier un EI, ajouter une intervention, etc.) restent possibles. Le « comportement en fin d'essai (lecture seule ou blocage) » n'est pas paramétrable. | 🟡 |
| EI : mêmes règles | Même mécanisme (`ModuleMetier.EI`). | 🟡 |
| Formation : payant à l'unité | Oui (réservation + KKiaPay). | ✅ |
| Le tableau de bord établissement affiche le statut de chaque module (actif, essai **– jours restants**, expiré) **avec un accès direct à la souscription** | Statut affiché (`StatutAbonnementBadge`, `tableau-de-bord/page.tsx`). Pour l'essai, c'est une date de fin (« Essai jusqu'au … »), pas un nombre de jours restants. **Aucun bouton ni lien de souscription.** | 🟡 |
| §10.5 Table des paramètres tarifaires : prix NEWS, prix EI, durée d'essai, tarifs des formules, comportement en fin d'essai | Seule la **durée d'essai** est paramétrable en base (`ParametrePlateforme`, page `/admin/parametres`). Les prix d'abonnement et le comportement en fin d'essai n'existent pas. Les tarifs de formation sont modifiables, mais formation par formation (écran Formations), pas dans un écran « Paramètres tarifaires ». | ❌ / 🟡 |

### 3.3 Module 1 : Auto-évaluation (§6)

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| §6.1 Deux grilles officielles EH et ESPC | **Placeholders uniquement** (`prisma/seed.ts` : « ⚠️ À remplacer par le vrai référentiel avant toute mise en production »). | ❌ |
| §6.1 / §12.2 L'admin fait évoluer les grilles (domaines, normes, critères, questions) | Complet : création, édition tant que brouillon, publication, archivage, nouvelle version par clonage (`GrillesService`). Éditeur arborescent : `/admin/grilles/[id]`. | ✅ |
| §6.2 **Une seule question à la fois**, domaine par domaine | ⚠️ `questionnaire.tsx` affiche **toutes les questions de tous les domaines sur une page qui défile**. Un plan latéral sert d'ancres. Pas de navigation « question suivante / précédente ». | ⚠️ |
| §6.2 Barre de progression + plan de navigation latéral | Présents. | ✅ |
| §6.2 Reprise d'une session interrompue | Chaque réponse est enregistrée immédiatement (`PUT .../reponses/:id`). Les sessions en cours sont listées et peuvent être reprises. | ✅ |
| §6.2 / §6.6 Élément mesurable typé (document à examiner / entretien / observation) + `entre_dans_score` | **Absent.** `ElementMesurable` n'a qu'un `typeReponse` (`OUI_NON`/`TEXTE`/`CHOIX`). Aucun type « document / entretien / observation », aucun booléen « entre dans le score ». | ❌ |
| §6.3 Critère validé seulement si **tous ses documents à examiner** sont positifs ; un seul manquant suffit à l'invalider | `scoring.util.ts` : un critère est validé si **tous** ses éléments sont positifs. La règle « un seul manquant invalide » est respectée. **Mais tous les éléments comptent**, y compris ceux qui ne sont pas des documents, faute de typage. Pour `TEXTE`/`CHOIX`, « non vide » vaut « positif » : c'est une approximation assumée dans le commentaire du code. | 🟡 |
| §6.3 Score par domaine et global = % de critères validés | Conforme (`calculerScore`). | ✅ |
| §6.4 Score global et par domaine, liste des critères non validés | Page `/auto-evaluation/[id]/resultats`. | ✅ |
| §6.4 Liste des **documents** non validés | Seuls les **critères** non validés sont listés, pas les éléments/documents manquants. | 🟡 |
| §6.4 Recommandations synthétiques par critère en écart | **Absentes.** Aucun champ recommandation dans le modèle, aucun texte généré. | ❌ |
| §6.4 Graphique d'évolution sur plusieurs sessions | `EvolutionChart` sur le tableau de bord établissement (`/sessions-evaluation/evolution`). | ✅ |
| §6.4 PDF généré automatiquement | **Absent.** Le modèle `RapportPdf` existe mais n'est jamais rempli. Aucune librairie PDF ni file d'attente dans les dépendances. | ❌ |
| §6.5 Historique complet | Sessions conservées et listées. | ✅ |
| §6.5 L'admin compare les niveaux de conformité **entre établissements** | Seule une **moyenne par type** (EH/ESPC) est calculée (`/analytics`, M5). Pas de comparaison établissement par établissement. La fiche admin d'un établissement n'affiche pas ses évaluations. | 🟡 |
| §6.6 Session liée à une version figée de la grille | Une session pointe sur une `grilleId` ; une grille publiée est immuable (409 si on tente de la modifier). Équivalent fonctionnel. | ✅ |
| §6.6 Score calculé côté serveur à la soumission | `SessionsEvaluationService.soumettre`. | ✅ |
| §6.6 Génération du rapport en tâche asynchrone (file d'attente) | Absent (pas de PDF, pas de file). | ❌ |
| §8.4 Rapport enrichi par les EI liés à un critère | Absent (ni rapport, ni affichage des EI liés dans les résultats). | ❌ |

### 3.4 Module 2 : Score NEWS (§7)

**§7.1 Fiche patient**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Fiche **minimale** : identifiant interne, service, **n° de lit**, **sans données d'identité complètes** | ⚠️ `Patient` et `CreatePatientDto` **exigent `nom` et `prenom`**. Ils acceptent `dateNaissance`, `sexe` et `numeroDossier`. **Pas de numéro de lit.** Le formulaire web (`patient-form.tsx`) demande nom, prénom, date de naissance, sexe, n° de dossier, mais pas de service. | ⚠️ |
| Création à l'admission, mesures rattachées, clôture à la sortie avec historique conservé | `POST /patients`, `POST /patients/:id/mesures`, `POST /patients/:id/cloturer`. Plus aucune mesure possible après la sortie. | ✅ |

**§7.2 Grille de calcul, comparée au tableau du CDC** (`news-scoring.util.ts`)

| Paramètre | CDC | Code | Écart |
|---|---|---|---|
| Fréquence respiratoire 9–11 | **2** | **1** | ⚠️ |
| FR > 20 | non défini dans le tableau du CDC | 21–24 → 2, ≥ 25 → 3 (NEWS2) | le CDC ne le précise pas |
| SpO2 | ≤91 : 3 · 92–93 : 2 · 94–95 : 1 · ≥96 : 0 | identique | ✅ |
| Oxygène d'appoint « Oui » | **3** | **2** | ⚠️ |
| Température > 40 | **3** | **2** | ⚠️ |
| Température 39,1–40,0 | non défini dans le CDC | 2 | le CDC ne le précise pas |
| PAS | ≤90 : 3 · 91–100 : 2 · 101–110 : 1 · 111–219 : 0 | identique (≥ 220 → 3, non défini dans le CDC) | ✅ |
| Fréquence cardiaque | identique au CDC | identique | ✅ |
| Conscience (Alerte = 0, confus ou inconscient = 3) | identique | identique (échelle ACVPU) | ✅ |
| Niveaux : faible 0–4, moyen 5–6 ou un paramètre à 3, élevé ≥ 7 | identique | identique | ✅ |

> Le code suit l'échelle NEWS2 standard du Royal College of Physicians, choix documenté dans `ROADMAP.md`. Le tableau du CDC en diffère sur 3 valeurs. **Il faut une décision du client** : soit corriger le CDC, soit aligner le code sur le CDC. Ce rapport ne tranche pas.

**§7.3 à §7.5**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| §7.3 Saisie rapide mobile ou tablette, score calculé automatiquement | Formulaire `mesure-form.tsx` ; le score est calculé par le serveur à l'enregistrement. Pas d'aperçu du score pendant la saisie. Le rendu mobile n'a pas été vérifié visuellement (ROADMAP 10.12). | 🟡 |
| §7.3 Code couleur par niveau de risque | `RisqueBadge` (vert / orange / rouge). | ✅ |
| §7.3 **Fréquence de surveillance suggérée** (12 h / 4–6 h / continue) | **Absente** (aucune occurrence dans le code). | ❌ |
| §7.3 Alerte automatique (visuelle + notification) | Une `Alerte` est créée dans la même transaction si le niveau est MOYEN ou ÉLEVÉ, puis un email Brevo est envoyé. Visuel : liste des alertes et cloche `alerts-bell.tsx` côté établissement. | ✅ |
| §7.3 Alerte envoyée au « **personnel désigné** » | Les destinataires sont **codés en dur** : `RESP_QUALITE` et `RESPONSABLE_COMPTE` de l'organisation. Aucune désignation possible. | 🟡 |
| §7.3 Journal des interventions : action, personnel, horodatage | `Intervention` (note, utilisateur, `createdAt`). | ✅ |
| §7.4 Courbe d'évolution par patient | `ScoreNewsChart` sur `/news/[id]`. | ✅ |
| §7.4 Export ou impression de la fiche de surveillance | L'API renvoie du JSON (`GET /patients/:id/export`). **Ce n'est utilisé par aucun écran.** Pas d'impression, pas de PDF, pas de CSV sur le tableau des mesures. | ❌ |
| §7.5 Score et niveau recalculés côté serveur par une fonction testable | Oui, 44 tests unitaires (`news-scoring.util.spec.ts`). | ✅ |
| §7.5 Alerte = **événement métier écouté par un job** de notification (découplé) | ⚠️ Appel **direct et synchrone** à `MailerService` depuis le service, sans bus d'événements ni job. Fonctionnellement, l'email part quand même. | ⚠️ |
| §7.5 Tâche quotidienne d'expiration des essais | `ExpirationEssaisScheduler` (tous les jours à minuit). | ✅ |
| §7.5 Accès filtré par `organisation_id` | Oui, avec 404 hors périmètre. Tests e2e dédiés (`multi-tenant.e2e-spec.ts`), non relancés ici. | ✅ |
| §7.5 Champs `alertes.destinataire_id`, `date_traitement` | Absents du modèle `Alerte`. | 🟡 |

### 3.5 Module 3 : Événements indésirables (§8)

**§8.1 Fiche de déclaration**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Date et heure de survenue | **Absent.** Seule `dateDeclaration` existe, remplie automatiquement. | ❌ |
| Service ou lieu concerné | Accepté par l'API (`serviceId`), mais **absent du formulaire web** et inutilisable (aucun service ne peut être créé). | ❌ |
| Type d'événement, liste paramétrable par l'admin | `TypeEi` + page `/admin/types-ei`. **Aucune liste par défaut** (chute, erreur médicamenteuse…) n'est pré-remplie. | ✅ / 🟡 |
| Description factuelle | Oui. | ✅ |
| Gravité à la déclaration | Non : la gravité n'est saisie qu'à la **qualification**, par le responsable qualité. Échelle à 3 niveaux (FAIBLE / MODÉRÉE / ÉLEVÉE), alors que le CDC cite en exemple 4 niveaux dont « décès ». | 🟡 |
| **Personnes impliquées ou témoins (obligatoire)** | **Absent** du modèle, du DTO et du formulaire. | ❌ |

**§8.2 Circuit de traitement**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Réception + envoi à la zone sanitaire ou au ministère | L'EI apparaît bien dans la file du responsable qualité (`file-attente`). **Aucune transmission** vers la zone sanitaire ou le ministère. | 🟡 |
| Qualification : gravité, **catégorie**, **priorisation** | Gravité seulement. Pas de confirmation de catégorie, pas de priorisation. | 🟡 |
| Analyse des causes : immédiates et profondes, **champs guidés** (arbre des causes / 5 pourquoi) plutôt que texte libre | Type immédiate/profonde + **texte libre** (`CreerCauseDto.description`). Pas de champs guidés. | 🟡 |
| Plan d'action : responsable + échéance | Le modèle le permet. Mais le **responsable est toujours l'auteur lui-même** : champ caché dans `action-corrective-form.tsx`, faute de liste des membres. | 🟡 |
| Suivi des actions : à faire / en cours / réalisée | Oui. | ✅ |
| **Clôture une fois toutes les actions réalisées et validées** | ⚠️ La clôture est **possible même si des actions ne sont pas réalisées** : `changerStatut` ne vérifie pas l'état des actions. | ⚠️ |

**§8.3 Tableau de bord et alertes**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Vue par **typologie**, gravité, service, statut | Gravité, service et statut : présents. **Typologie absente** : `typeEiId` est lu mais jamais agrégé. | 🟡 |
| Délai moyen de traitement et taux de clôture | Présents. | ✅ |
| Alerte **immédiate** pour un EI de gravité élevée (+ direction selon paramétrage) | Email envoyé **au moment de la qualification** en ÉLEVÉE, pas à la déclaration (la déclaration ne comporte pas de gravité). Pas de paramétrage « direction ». | 🟡 |
| Historique et export sur une période donnée | L'API accepte `?debut=&fin=` (JSON et CSV). Le **bouton web exporte tout**, sans choix de période. | 🟡 |

**§8.4 et §8.5**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| §8.4 Lien EI → critère d'auto-évaluation, sans effet sur le score | L'API accepte `critereId`, qui n'est jamais lu par le calcul du score. **Aucun champ dans le formulaire web.** Le lien n'enrichit aucun rapport. | 🟡 |
| §8.5 Déclaration anonyme (`declarant_id` nullable) | `declareParId` est **non nullable** : l'anonymat est impossible. La phrase du CDC est incomplète (« Le champ declarant_id. »), donc l'exigence est ambiguë. | 🟡 |
| §8.5 Machine à états **déclaré → qualifié → en_analyse → plan_action → clôturé** | ⚠️ **3 statuts seulement** : `DECLARE → EN_TRAITEMENT → CLOTURE`. | ⚠️ |
| §8.5 Chaque transition historisée (qui, quand) | Oui (`EvenementTransition`). La qualification (gravité), elle, n'est pas historisée. | ✅ / 🟡 |
| §8.5 Même mécanisme événement/notification que NEWS | Même approche (appel direct au mailer), donc même absence de mécanisme événementiel (voir §7.5). | 🟡 |
| §8.5 Pièces jointes | Upload Cloudinary : 10 Mo maximum ; images, PDF et texte. | ✅ |

### 3.6 Module 4 : Formations (§9)

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Catalogue : titre, durée, **objectifs**, tarif ; présentiel | Titre, description, durée (heures), 3 tarifs. **Pas de champ « objectifs ».** | 🟡 |
| Statut publiée / brouillon | Remplacé par `actif` (vrai/faux). Équivalent fonctionnel. | ✅ |
| Choix de la formule : individuelle, groupe 5, groupe 10 | Oui. | ✅ |
| Paiement via le widget KKiaPay | Widget intégré (`kkiapay-button.tsx`). **Aucun paiement réussi n'a été testé de bout en bout** (ROADMAP 9.11/9.13). | 🟡 |
| Message « date communiquée sous 48 h » | Email + message dans l'écran après paiement. | ✅ |
| L'admin fixe la date, l'utilisateur est notifié et voit la date | `PATCH /reservations/:id/date-rdv`, email, date visible dans « Mes réservations ». | ✅ |
| Statuts : attente paiement, payée, confirmée, réalisée, annulée | Les 5 statuts sont présents. | ✅ |
| §9.3 Tarif figé au paiement (copié sur la réservation) | Copié à la **création** de la réservation (`tarifApplique`), juste avant le paiement. Équivalent. | ✅ |
| §9.3 Factures : réservation **ou abonnement**, devise, **PDF** | Facture créée automatiquement au passage « payée » (numéro `FAC-AAAA-NNNNNN`). **Pas de devise, pas de PDF, pas de facture d'abonnement.** | 🟡 |

### 3.7 Paiement KKiaPay (§10.4)

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| 3 clés (publique côté front, privée et secrète côté serveur) | Variables d'environnement présentes et utilisées (`KkiapayService`, `kkiapay-button.tsx`). | ✅ |
| Paiement des **abonnements** | **Absent** (formations uniquement). | ❌ |
| Vérification serveur obligatoire avant confirmation | `verifierPaiement` : appel au SDK, contrôle du statut `SUCCESS` et du montant. | ✅ |
| Webhook pour les paiements finalisés après fermeture de la page (USSD tardif) | ⚠️ Le webhook existe, mais il cherche la réservation par `kkiapayTransactionId`. Or ce champ n'est rempli **qu'après** une confirmation réussie (`confirmerPaiement`). Pour une réservation encore « en attente de paiement », il ne trouve donc jamais rien. Le widget envoie bien `data: reservationId`, mais le webhook ne lit pas cette donnée. **Le cas précis décrit par le CDC n'est donc pas couvert.** Constat tiré de la lecture du code, non testé en réel. | ⚠️ |
| Sandbox en test, production à la mise en ligne | Géré par `KKIAPAY_SANDBOX`. Pas encore de production. | 🟡 |

### 3.8 Facturation et notifications (§11)

**§11.1 Facturation**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Une facture pour chaque paiement | Oui pour les formations uniquement. | 🟡 |
| Facture **téléchargeable** | **Non** : seul le numéro est affiché. | ❌ |
| Historique des transactions | Liste « Mes réservations » (statut + numéro de facture). | 🟡 |

**§11.2 Notifications email** (plus visibles dans l'espace personnel)

| Notification exigée | Constat dans le code | Statut |
|---|---|---|
| Confirmation d'inscription | Un email de **vérification** est envoyé (lien à cliquer). Pas d'email de confirmation séparé. | 🟡 |
| Confirmation de paiement (abonnement ou formation) | Formation : oui (email générique). Abonnement : sans objet, les abonnements n'existent pas. | 🟡 |
| Rappel avant expiration d'essai | **Absent.** | ❌ |
| Alerte clinique moyen/élevé au personnel désigné | Email aux responsables (voir §7.3). | 🟡 |
| Nouvel EI de gravité élevée | Email à la qualification. | 🟡 |
| Date de RDV de formation | Oui. | ✅ |
| Rappel avant la session de formation | **Absent.** | ❌ |
| Rapport PDF disponible | **Absent** (pas de PDF). | ❌ |
| Notifications **visibles dans l'espace personnel** | Le modèle `Notification` (in-app) n'a **qu'un déclencheur**, destiné aux **admins** (réservation payée). Les établissements et les particuliers n'ont pas d'historique de notifications. La cloche côté établissement affiche les alertes NEWS, pas les notifications ci-dessus. | 🟡 |

### 3.9 Tableau de bord administrateur (§12)

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| §12.1 Liste des établissements **+ statut de chacun de leurs modules** | La liste existe (`/admin/etablissements`). **Le statut des modules n'y est pas affiché** (aucune jointure avec les abonnements). | 🟡 |
| §12.1 Fiche détaillée : historique des évaluations, alertes, EI, formations | La fiche affiche **uniquement des compteurs** (utilisateurs, patients, EI, réservations). Pas d'historique des évaluations, pas de liste des formations réservées. | 🟡 |
| §12.1 **Activer, suspendre, prolonger** un essai ou un abonnement | Seule une **activation** existe côté API (`POST /abonnements/:org/:module/activer`), **sans aucun écran**. Suspendre et prolonger n'existent pas. Le bouton « désactiver l'établissement » change un champ `actif` qui **n'est vérifié nulle part** : il ne bloque rien (constat confirmé par `AuthService.login`, qui ne regarde que `Utilisateur.actif`). | ❌ / 🟡 |
| §12.1 Contacter un établissement via **WhatsApp** | **Absent** (aucune occurrence dans le code). | ❌ |
| §12.2 Grilles : créer, modifier, activer, archiver, versionner | Complet (API + éditeur). | ✅ |
| §12.3 Paramétrer les **seuils NEWS et fréquences de surveillance** | **Absent**, par décision (ROADMAP 7.13 : les seuils NEWS2 sont fixes). Ça contredit le §12.3 et le §13.5 du CDC. | ❌ |
| §12.3 Superviser les alertes actives de tous les établissements, sans données patient | `/admin/alertes` (`alertes-plateforme`), agrégé par organisation, sans données patient. | ✅ |
| §12.4 Paramétrer les types d'EI | Oui. | ✅ |
| §12.4 Paramétrer l'**échelle de gravité** | **Absent** (enum fixe à 3 niveaux). | ❌ |
| §12.4 Statistiques EI agrégées et anonymisées, tous établissements | `/admin/analytics` (M6 : par statut et gravité, taux, délai). | ✅ |
| §12.5 Créer et publier des formations | Oui. | ✅ |
| §12.5 Gérer les réservations et fixer les dates | Oui. | ✅ |
| §12.5 Clôturer une session, suivre les présences | Un booléen `presenceConfirmee` par réservation (« marquer réalisée »). Suivi minimal : pas de liste de participants pour une formule de groupe. | 🟡 |
| §12.6 Établissements inscrits et actifs **par module** | Inscrits, actifs et par type : oui. **Par module : non.** | 🟡 |
| §12.6 Évaluations, alertes cliniques, EI **par période** | Totaux instantanés. **Aucun filtre ni découpage par période.** Les alertes sont comptées via les mesures par niveau. | 🟡 |
| §12.6 Taux de conformité moyen | Moyenne par type EH/ESPC. | ✅ |
| §12.6 Réservations en attente de traitement | Répartition par statut. | ✅ |
| §12.6 **Évolution globale de l'activité dans le temps** | **Absente** (aucune série temporelle). | ❌ |

### 3.10 Engagements et garanties (§13)

**§13.1 Confidentialité**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Chaque établissement ne voit que ses propres données | Toutes les requêtes métier sont filtrées par l'`organisationId` du jeton, avec 404 hors périmètre. Tests e2e dédiés présents (non relancés ici). | ✅ |
| Point de vigilance | `ActionCorrective.responsableId` est accepté **sans vérifier** que l'utilisateur appartient à la même organisation (`CreerActionCorrectiveDto`, `ajouterActionCorrective`). | 🟡 |

**§13.2 Sécurité de l'accès**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Identifiant et mot de passe personnels | bcrypt (12 rounds), JWT de 15 min + refresh révocable, email vérifié obligatoire. | ✅ |
| **Vérification de l'IFU** | Unicité seulement. Pas de contrôle de format (13 chiffres), pas de vérification auprès d'une source officielle. | 🟡 |
| Journalisation des accès | Connexion et déconnexion journalisées (`JournalAudit`). | ✅ |
| Journalisation des actions sensibles (création, modification, suppression de fiche patient ; clôture d'EI) | **Création et clôture de fiche patient : non journalisées.** Clôture d'EI : historisée dans `evenement_transitions`, pas dans le journal d'audit. | 🟡 |
| Protection contre les accès frauduleux | Limitation de débit (throttling) sur connexion, inscription et mot de passe oublié (5 requêtes par minute). Pas de verrouillage de compte. | ✅ / 🟡 |

**§13.3 à §13.5**

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| §13.3 Disponibilité 24/7 | Non déployé : impossible à évaluer. | ❌ |
| §13.4 Auto-évaluation soumise définitive | 409 sur toute modification après soumission. | ✅ |
| §13.4 Mesure NEWS et fiche EI non supprimables | Aucun endpoint de suppression. | ✅ |
| §13.4 **Correction tracée (horodatée, avec motif)** | **Absente.** Aucune correction n'est possible : ni pour une mesure NEWS, ni pour la description d'un EI. | ❌ |
| §13.5 Grilles versionnées sans toucher aux données existantes | Oui. | ✅ |
| §13.5 Seuils NEWS évolutifs | Non (codés en dur). | ❌ |
| §13.5 Typologie EI évolutive | Oui (types désactivables). | ✅ |

### 3.11 Environnements et périmètre (§10.6, §15)

| Exigence CDC | Constat dans le code | Statut |
|---|---|---|
| Environnement de test `dsp.sedjro.africa` | Non fait (ROADMAP 13.1 à 13.13 : tout est à faire). Aucun Dockerfile ni configuration de déploiement dans le dépôt. | ❌ |
| Production | Non fait. | ❌ |
| Un `.env` par environnement | Seul un `.env` de développement existe, plus les `.env.example`. | ❌ |
| §15 V1 minimale (module Auto-évaluation complet) | Non atteinte : grilles officielles, PDF, recommandations et mode « une question à la fois » manquent. | ❌ |

---

## 4. Ce qui a été fait en plus du CDC

Ces éléments sont **présents dans le code** mais **non demandés par le CDC**. Ils ne sont pas critiqués ici, juste signalés.

- **Comptes :**
  - mot de passe oublié et réinitialisation ;
  - vérification d'email bloquante ;
  - gestion de ses propres sessions actives (`/mes-sessions`) ;
  - édition de son profil et des coordonnées de l'établissement (`/organisation`).
- **Back-office :**
  - annuaire des utilisateurs (désactivation, révocation de sessions, ajout et retrait de rôles) ;
  - page Rôles et permissions ;
  - journal d'audit consultable ;
  - page Intégrations (état TiDB, Cloudinary, Brevo, KKiaPay) ;
  - page Sécurité (limites de débit) ;
  - notifications in-app pour l'admin.
- **Exports :** CSV sur les tableaux admin et export CSV des EI.
- **Site vitrine :** accueil, pages modules, à propos, CGU, politique de confidentialité, SEO.

---

## 5. Écarts entre `ROADMAP.md` et le code réel

- La section « État global actuel » de la roadmap est datée du **2026-09-17** et n'est plus à jour. Exemples : les phases 11–13 y sont dites « non démarrées » alors que les intégrations Brevo, Cloudinary et KKiaPay existent ; le §10.11 est dit « à faire » alors que des `loading.tsx` et `error.tsx` existent.
- La roadmap coche 8.1 « fiche standardisée », 7.1 « fiche patient », 6.3 « question par question » et 11.2 « notifications ». **Le code ne correspond pas au texte du CDC sur ces points** (voir §3). Les cases cochées ne signifient donc pas « conforme au CDC ».
- La roadmap reconnaît elle-même :
  - les grilles placeholder (4.11) ;
  - le PDF bloqué (6.8) ;
  - le back-office NEWS reporté (7.13) ;
  - l'échelle de gravité non paramétrable (8.17) ;
  - l'absence de rappel de formation (9.6) ;
  - l'absence de liste des membres (8.16) ;
  - le rendu mobile non confirmé (10.12).
- Elle **ne mentionne pas** :
  - l'absence de création d'utilisateurs internes et de services par l'établissement comme non-conformité au §4.2 ;
  - l'absence de champs obligatoires dans la fiche EI (survenue, témoins) ;
  - les 3 écarts de la grille NEWS avec le tableau du CDC ;
  - la faille du webhook pour les paiements tardifs.

---

## 6. Tests

- **Tests unitaires API (sans base de données)**, lancés le 30/09/2026 :
  - 1er lancement complet : **80 / 81 passent**. Un échec dans un `beforeEach` de `src/auth/auth.service.spec.ts`. Ce lancement a été très lent : 152 s rien que pour les imports.
  - Relance de ce seul fichier : **19 / 19 passent**. L'échec semble donc lié à la lenteur de la machine plutôt qu'au code. Cette cause n'est pas démontrée.
  - Fichiers couverts : scoring auto-évaluation, scoring NEWS (44 tests), auth, permissions.
- **Tests e2e** (11 fichiers dans `apps/api/test/`) : **non relancés**, car ils écrivent dans la vraie base TiDB. D'après la roadmap, ils passaient au 21–22/09/2026 ; je ne l'ai pas vérifié.
- **Aucun test** sur le module EI (machine à états) en unitaire, ni sur les réservations et paiements.
- **Aucun test frontend** (pas de Playwright ni de tests de composants).
- **Aucun paiement KKiaPay abouti testé** (d'après la roadmap).

---

## 7. Autres constats techniques (hors CDC, utiles pour la mise en production)

1. **Git :** environ 80 fichiers web modifiés et environ 25 non suivis ne sont **pas commités**.
2. **Script temporaire non suivi :** `apps/api/prisma/temp-visual-check-setup.ts` contient un **mot de passe admin en clair**. Il réinitialise le mot de passe de l'admin ; son en-tête dit « à supprimer après usage ». À supprimer, et à ne jamais commiter.
3. **Marque DSP :** les emails affichent encore « dps.bj » (sujets et corps dans `mailer.service.ts`, `email-verification.template.ts`, nom d'expéditeur par défaut dans `brevo.service.ts`). Même chose pour les liens de réseaux sociaux (`site-config.ts`).
4. **Questionnaire :** un champ `TEXTE` déclenche un enregistrement API **à chaque frappe** (`onChange` → `repondre`).
5. **Liste des alertes NEWS :** elle n'est pas filtrée par service pour le personnel soignant, contrairement à la liste des patients.
6. **Configuration :** pas de `helmet` ni d'en-têtes de sécurité HTTP dans `main.ts`. CORS est ouvert à `true` si `WEB_APP_URL` est absent.
7. **Sessions :** pas de rafraîchissement silencieux de session côté web. Retour à la page de connexion toutes les 15 minutes (ROADMAP 10, choix assumé).

---

## 8. La plateforme est-elle prête ?

**Non.**

- **Pour une démonstration :** oui. Les parcours des quatre modules fonctionnent de bout en bout avec des données de test, et le back-office est riche.
- **Pour une mise en production conforme au CDC :** non. Les raisons, dans l'ordre d'impact :

1. **Multi-utilisateur impossible côté établissement** (§4.2). Pas de création d'utilisateurs internes ni de services. NEWS et EI ne peuvent pas être utilisés comme le CDC le prévoit (plusieurs soignants, filtrage par service).
2. **Contenu métier manquant :** les grilles officielles ARS EH et ESPC ne sont pas intégrées.
3. **Modèle économique non branché :** pas de prix d'abonnement, pas de paiement d'abonnement, pas de souscription. À l'expiration de l'essai, l'établissement est bloqué sans solution.
4. **Non-conformités réglementaires et fonctionnelles :**
   - fiche patient avec nom et prénom (contraire au §7.1) ;
   - grille NEWS différente du CDC sur 3 valeurs ;
   - fiche EI sans date de survenue ni témoins (champ obligatoire) ;
   - circuit EI à 3 statuts au lieu de 5 ;
   - clôture d'EI possible avec des actions non réalisées.
5. **Livrables absents :**
   - rapport PDF d'auto-évaluation et recommandations ;
   - factures téléchargeables ;
   - export ou impression de la fiche NEWS ;
   - fréquence de surveillance suggérée ;
   - rappels par email (fin d'essai, session de formation) ;
   - corrections tracées (§13.4).
6. **Back-office incomplet sur le §12 :**
   - activer, suspendre ou prolonger un abonnement depuis un écran ;
   - statut des modules par établissement ;
   - WhatsApp ;
   - seuils NEWS et échelle de gravité ;
   - statistiques par période et évolution dans le temps.
7. **Paiement tardif (webhook) non couvert.** Aucun paiement réel validé.
8. **Aucun déploiement :** ni recette `dsp.sedjro.africa`, ni production.

---

## 9. Ce qu'il reste à faire, dérivé strictement des écarts ci-dessus

Cette liste ne fait que reprendre les écarts constatés. Aucune fonctionnalité n'y est ajoutée.

**A. Bloquant V1 (Auto-évaluation, §15)**
- Intégrer les grilles officielles EH et ESPC.
- Typer les éléments mesurables (document / entretien / observation) et ajouter « entre dans le score ».
- Passer le questionnaire en « une question à la fois ».
- Lister les documents non validés.
- Ajouter les recommandations par critère.
- Générer le rapport PDF en asynchrone, avec la notification « rapport disponible ».
- Donner à l'admin une vue comparative par établissement.

**B. Bloquant NEWS / EI**
- Création d'utilisateurs internes et de services par le responsable du compte.
- Fiche patient minimale : identifiant interne, service, n° de lit, sans identité.
- Décision client sur la grille NEWS (CDC ou NEWS2).
- Fréquence de surveillance suggérée.
- Export ou impression de la fiche.
- Désignation des destinataires d'alerte.
- Fiche EI complète : survenue, service, témoins, gravité à la déclaration.
- 5 statuts EI.
- Clôture conditionnée aux actions réalisées.
- Causes en champs guidés ; priorisation.
- Choix du responsable d'une action.
- Typologie dans le tableau de bord.
- Export par période dans l'interface.
- Lien vers un critère dans le formulaire.

**C. Abonnements et paiements**
- Paramètres tarifaires : prix NEWS, prix EI, comportement en fin d'essai.
- Souscription et paiement KKiaPay des abonnements.
- Factures PDF téléchargeables (formations et abonnements).
- Webhook capable de rattacher une transaction via `data` (reservationId).
- Test d'un paiement sandbox réel.

**D. Notifications (§11.2)**
- Rappel de fin d'essai.
- Rappel avant session de formation.
- Notifications in-app pour les utilisateurs d'établissement et les particuliers.

**E. Back-office (§12)**
- Statut des modules par établissement.
- Activer, suspendre, prolonger (écran).
- WhatsApp.
- Historique détaillé dans la fiche établissement.
- Seuils NEWS et fréquences (§12.3, §13.5).
- Échelle de gravité EI.
- Statistiques par période et évolution temporelle.

**F. Sécurité et traçabilité (§13)**
- Validation IFU sur 13 chiffres.
- Journalisation de la création et de la clôture des fiches patient.
- Corrections tracées pour les mesures NEWS et les EI.
- Vérifier que `responsableId` appartient à la même organisation.
- Rendre `Organisation.actif` effectif.

**G. Mise en service (§10.6)**
- Environnements de recette et de production, un `.env` par environnement.
- Bascule KKiaPay en production.
- Commit du travail en cours.
- Suppression du script temporaire.

---

*Rapport établi uniquement à partir de la lecture du code et du CDC, sans modification du projet.*
