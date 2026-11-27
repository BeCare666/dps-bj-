# Feuille de route — Grilles officielles ARS (module Auto-évaluation)

Suivi du point 4.7 de `ROADMAP_CONFORMITE_CDC.md`. Rapport détaillé : `GRILLES/RAPPORT_INTEGRATION_GRILLES.md`.

## Légende

| Marque | Sens |
|---|---|
| `[x]` | Fait et vérifié. La preuve est indiquée. |
| `[ ]` | Reste à faire de notre côté. |
| `[!]` | Bloqué par une décision du client ou de l'ARS. Rien ne doit être inventé. |

## Étape 1 — Analyse de l'existant

- [x] **1.1** Modèle de données relu : Grille → Domaine → Norme → Critère → Élément mesurable.
  - L'élément porte sa nature (document, entretien, observation) et l'indication « entre dans le score ».
- [x] **1.2** Règle de score relue, `scoring.util.ts` :
  - un critère n'est validé que si tous ses documents sont à Oui ;
  - le score est le pourcentage de critères validés (CDC §6.3).
- [x] **1.3** Questionnaire relu : une question à la fois, Oui/Non, pastille « N'entre pas dans le score ».
- [x] **1.4** Constat de départ :
  - seules des grilles « placeholder » étaient en base, avec 1 critère chacune ;
  - le point 4.7 attendait le contenu du client.

## Étape 2 — Analyse des 4 PDF fournis

- [x] **2.1** Manuels EH (§2.2.1) et ESPC (« Les critères essentiels ») : critère essentiel = 1 si toutes ses preuves sont justifiées, 0 sinon. Il faut 100 % pour le niveau 1.
  - C'est la règle déjà codée : **aucun changement du calcul.**
- [x] **2.2** Effectifs annoncés par les manuels : 25 critères essentiels pour les EH, 30 pour les ESPC.
- [x] **2.3** Grilles extraites cellule par cellule, puis contrôlées visuellement page par page (21 p. EH, 15 p. ESPC).
- [x] **2.4** Comparaison avec les manuels, critère par critère :
  - EH : 22 critères sur 25 ont exactement le nombre de documents du manuel ; les 3 autres sont expliqués dans le rapport ;
  - ESPC : nombreux écarts, listés dans le rapport, section 5.
- [x] **2.5** Corrections journalisées une par une : 15 pour EH, 26 pour ESPC (rapport, section 6).

## Étape 3 — Données et base

- [x] **3.1** Données : `apps/api/prisma/grilles-ars/eh.json` et `espc.json`.
- [x] **3.2** Migration `20261012100000_grilles_ars_registre` : nouveau champ `criteres.registre`.
- [x] **3.3** Migration `20261012110000_grilles_ars_libelles_longs` : libellés passés en TEXT, jusqu'à 645 caractères, sans troncature.
  - *Vérifié le 12/10* : `prisma migrate status` répond « up to date » et `migrate diff` est vide.
- [x] **3.4** Import idempotent : `prisma/grilles-ars/importer.ts`.
  - Il est appelé par le seed et par `npx tsx prisma/import-grilles-ars.ts`.
- [x] **3.5** Grilles publiées en v1 dans la base de développement, placeholders archivés.
  - *Vérifié le 12/10* : le contenu en base est **identique** aux JSON pour les deux grilles ; les placeholders v1 sont ARCHIVEE.

## Étape 4 — Code

- [x] **4.1** API : `registre` est pris en charge dans le DTO, à la création et lors d'une nouvelle version.
- [x] **4.2** Web : le registre est affiché dans le questionnaire, le visualiseur et l'éditeur admin.
  - L'éditeur le conserve à l'enregistrement.

## Étape 5 — Tests

- [x] **5.1** `src/grilles/grilles-ars.spec.ts` : **11/11**.
  - Couvre : effectifs, codes, rattachement, Oui/Non, score, et acceptation par l'API admin.
  - *Relancé le 12/10.*
- [x] **5.2** `scoring.util.spec.ts` : **10/10**. *Relancé le 12/10.*
- [x] **5.3** e2e `auto-evaluation-conformite.e2e-spec.ts` : **6/6**, avec un délai de 180 s à cause de la charge de la machine.
  - Ce test utilise ses propres grilles, pas les grilles officielles.
- [x] **5.4** `tsc` API et web : OK sur le code modifié.
  - Deux erreurs subsistent, dans des fichiers non modifiés : `test/app.e2e-spec.ts` et `.next/dev/types/validator.ts`.

## Étape 6 — Reste à faire de notre côté (dans cet ordre)

- [x] **6.1** **Parcours complet par l'API sur les grilles officielles** (12/10/2026).
  - Test : `apps/api/test/grilles-ars-parcours.e2e-spec.ts`, **10/10**.
  - Conditions : établissements de test EH et ESPC, sur les grilles officielles publiées.
  - Les grilles ne sont pas modifiées. Les données de test sont supprimées à la fin : 0 restante, vérifié en base.
  - Vérifié pour chacune des deux grilles :
    - la liste ne montre que des grilles publiées de son type, dont la grille officielle v1 ; la placeholder n'y figure plus ;
    - la structure reçue compte 25 critères pour EH et 30 pour ESPC ; les 30 critères ESPC portent un « Registre … » ;
    - démarrer une session sur la grille de l'autre type est refusé (400) ;
    - réponses : tous les documents à Oui, sauf le document au libellé le plus long (Non) et un document laissé sans réponse ; des entretiens et observations à Non ;
    - score à la soumission = score calculé : **EH 92 %** (23/25), **ESPC 93,33 %** (28/30) ;
    - les entretiens et observations n'ont aucun effet sur le score ;
    - résultats : exactement les 2 critères en écart ; le libellé officiel complet apparaît avec « NON » ; le document non répondu apparaît avec « SANS_REPONSE » ;
    - rapport PDF : généré par la file, statut DISPONIBLE, téléchargé, en-tête `%PDF-`.
  - Contrôle visuel des deux PDF :
    - score global et scores par domaine corrects ;
    - libellés longs (B.3.1.1 EH, C.1.1.2 ESPC) affichés en entier, sur plusieurs lignes ;
    - mention « (sans réponse) » présente.
  - Incident au 1er passage, 9/10 : le test vérifiait le rapport ESPC pendant que la tâche planifiée (toutes les 30 s) le générait encore.
    - `traiterFile()` rend la main sans rien faire quand un passage est déjà en cours.
    - **Le test a été corrigé** : il attend le statut final, comme l'interface. Aucun changement de code applicatif.
  - Observation, sans action : si un rapport est supprimé pendant sa génération, la mise à jour finale échoue (« record not found »). Ce cas ne se produit que lors du nettoyage des tests.
- [x] **6.2** **Page Résultats avec une grille officielle**, contenu (12/10/2026).
  - **Analyse du code** (`auto-evaluation/[id]/resultats/page.tsx`) :
    - libellés affichés en entier, sans coupure ;
    - sans recommandation saisie, la page affiche la recommandation de secours « mettre à disposition « … » », qui répète le libellé du document. C'est le comportement de l'étape 4.3, inchangé.
    - le « Registre » n'est pas affiché sur cette page : l'API des résultats ne le renvoie pas, et le CDC ne le demande pas ici.
  - **Test réel** :
    - établissement ESPC de test ;
    - parcours fait par l'API en marche, sur la grille officielle : 112 réponses, A.1.1.1 et C.2.1.1 à « Non », D.1.1.1 sans réponse ; score 90 %.
    - page `/auto-evaluation/:id/resultats` servie par le site en marche (HTTP 200) et vérifiée sur son HTML rendu côté serveur ;
    - points vérifiés, **tous OK** :
      - titre de la grille ;
      - score 90 % ;
      - 27 / 30 critères validés ;
      - score des 5 domaines ;
      - les 3 critères en écart, avec titre complet et document complet ;
      - mention « (sans réponse) » ;
      - aucun critère validé listé à tort ;
      - aucune erreur.
    - données de test supprimées et serveurs arrêtés après le test.
  - **Non fait** : contrôle visuel de la mise en page, car l'extension Chrome n'était pas connectée. Reporté à **6.4**.
  - **Constat d'environnement** : `next dev` avec Turbopack (défaut de Next 16) renvoie HTTP 500 sur **toutes** les pages de cette machine (« Can't resolve '@swc/helpers/_/_interop_require_default' »), alors que le fichier existe. `next dev --webpack` fonctionne. C'est le même problème que celui déjà noté pour `next build`.
- [x] **6.3** **Build web de production** (12/10/2026) : `npx next build --webpack`, **code de sortie 0**.
  - Compilation : 6,4 min.
  - TypeScript : 3,0 min, sans erreur.
  - 67 pages générées ; `/auto-evaluation`, `/auto-evaluation/[id]`, `/auto-evaluation/[id]/resultats` et `/admin/grilles/*` sont présentes.
  - `--webpack` est utilisé car Turbopack, défaut de `next build` et de `next dev`, échoue sur cette machine (constaté au 01/10 et le 12/10, voir 6.2). Le script `build` du projet n'a pas été modifié.
  - Un seul avertissement, antérieur à ce travail : « Next.js ignored package.json in C:\Users\PC\Desktop\dps because it is outside the current Git repository (apps/web) ». `apps/web` contient son propre dépôt `.git`. Non modifié, à examiner séparément si souhaité.
- [ ] **6.4** **Vérification dans un navigateur** :
  - questionnaire EH et ESPC, pastille registre ;
  - éditeur admin : ouvrir une grille officielle, cliquer « nouvelle version », enregistrer sans perte.
- [x] **6.5** **Commit** : fait par l'utilisateur, commit `a4229a0` du 12/10/2026 « grille auto update » (grilles EH/ESPC, importeur, 2 migrations, éditeur, questionnaire, rapport d'intégration). Constaté le 17/11/2026 dans l'historique git.

## Étape 7 — Décisions client / ARS

Rapport, section 5.

- [!] **7.1** EH E.1.1.1 : le manuel prévoit la règle « 80 à 100 % du personnel formé », absente de la grille. La plateforme applique la règle générale.
- [!] **7.2** Preuves exigées par le manuel ESPC mais absentes de la grille. Elles n'ont pas été ajoutées.
  - Concerne 5 preuves : C.2.1.1 (×3), C.2.1.2 (×1), D.2.1.1 (« eau courante propre »).
  - Écarts de placement : A.1.1.2, D.2.1.3 (classée en Observation) et E.1.1.1 (« piqûre d'aiguille » / « exposition au sang »).
  - EH : aucune preuve manquante.
  - *Vérifié preuve par preuve sur les 55 critères le 12/10* : voir le rapport, section 5.2.
- [!] **7.3** EH C.1.1.5, C.2.1.3, C.4.1.1 et C.4.1.2 : questions d'entretien qui semblent dupliquées depuis le critère précédent. Conservées, hors score.
- [!] **7.4** Sens des mentions « Registre CQSP / SP / EFE / RH / … » : non défini dans les documents.
- [!] **7.5** Colonnes de plan d'action de la grille (écart, responsable, action, délai, suivi) : absentes du CDC §6, donc non implémentées.
- [!] **7.6** ESPC A.5.1.1 : la note du manuel (« documenter la bonne foi… ») doit-elle devenir la recommandation du critère ?
- [!] **7.7** Base de développement : la grille « Grille Smoke Test EH », publiée et issue des tests du 17/09, est visible des établissements EH. Faut-il l'archiver ?

## Journal

- **12/10/2026** : étapes 1 à 5 faites. Re-vérification le même jour :
  - contenu en base = JSON ;
  - migrations à jour ;
  - tests unitaires 21/21.
- **12/10/2026** : étape 6.1 faite. e2e parcours sur les grilles officielles 10/10, PDF contrôlés visuellement.
- **12/10/2026** : contrôle preuve par preuve, manuels contre grilles, sur les 55 critères. Les écarts déjà signalés sont confirmés sur les PDF. Le rapport est complété : D.2.1.1 « eau courante propre », D.2.1.3 et E.1.1.1 ajoutés.
- **12/10/2026** : étape 6.2 faite (contenu de la page Résultats vérifié sur le rendu réel). Contrôle visuel reporté à 6.4 : extension Chrome non connectée.
- **12/10/2026** : étape 6.3 faite (build web --webpack OK, 0 erreur).
- **13/10/2026** : erreur signalée par l'utilisateur sur « Démarrer » et « Continuer » (auto-évaluation). Reproduction dans Chrome headless (CDP, compte de test ESPC 6.4, grille officielle), erreurs JS, console et HTTP capturées :
  - `next dev --webpack` (route déjà compilée puis serveur neuf) : « Démarrer » → session créée, question 1/194 ; « Continuer » → reprise à la 1re question sans réponse. **0 erreur.**
  - `next start` (build 6.3) : mêmes parcours, **0 erreur.**
  - `next dev` par défaut (Turbopack, ce que lance `npm run dev:web`) : **HTTP 500 sur toutes les pages**, `Cannot find module 'picocolors'` (globals.css) et, côté navigateur, `Cannot find module '@swc/helpers/_/_interop_require_default'`. Même constat d'environnement qu'en 6.2.
  - Données du compte de l'utilisateur (ESPC) vérifiées en base : même grille publiée, réponses valides, aucune anomalie.
  - Aucun code modifié. En attente du message d'erreur exact vu par l'utilisateur et de son mode de lancement.

## Étape 8 — Mise à jour du 26/11/2026 (dossier `mise_a_jour/`)

Sources : 6 grilles Excel fournies par le client (EH et ESPC × essentiels, fondamentaux, avancés). Les fichiers Excel font foi.

### 8.1 Analyse

- [x] **Effectifs** identiques aux manuels ARS : EH 25 + 94 + 15 = **134** critères ; ESPC 30 + 78 + 17 = **125**.
- [x] **Règle de notation** (onglet « Synthèse » de chaque fichier, manuels EH et ESPC § 2.2, tableau 7) :
  - essentiel : 1 si tous les documents sont présents, sinon 0 (règle déjà en place) ;
  - fondamental et avancé : 1 si au moins 80 % des documents sont présents, 0,5 entre 30 et 79 %, 0 en dessous de 30 % ;
  - pourcentage = score obtenu ÷ critères applicables.
- [x] **Grille EH Essentiel « corrigée »** : mêmes 25 critères que la v1. Changements :
  - questions d'entretien et d'observation de C.1.1.5, C.2.1.3, C.4.1.1 et C.4.1.2 corrigées (point 7.3 résolu par le client) ;
  - C.1.1.3 : « Procédures de surveillance des patients » devient un document à part entière (6 → 7 documents).
- [x] **Grille ESPC Essentiels** : profondément révisée (libellés, preuves, entretiens). 113 → 91 documents. La mention « Registre … » n'y figure plus.

### 8.2 Données

- [x] Conversion : `apps/api/prisma/grilles-ars/convertir_xlsx.py`. Elle lit les 6 fichiers et produit `eh.json`, `eh-fondamental.json`, `eh-avance.json`, `espc.json`, `espc-fondamental.json` et `espc-avance.json`.
- [x] Corrections appliquées, toutes dans la grille EH Essentiel et toutes affichées par le script :
  - domaine B sans nom et domaine E écrit deux fois : noms repris de la v1 ;
  - 7 libellés de normes abîmés (« patientse », « hôpial », « system. », reste de texte anglais en E.1) : les 12 libellés sont repris de la v1, contrôlée sur le manuel ;
  - catégorie « Essentielle » → « Essentiel » (D.2.1.1 et E.1.1.1) ;
  - un guillemet isolé en tête d'une question de C.1.1.2.
- [x] Import versionné (`importer.ts`) :
  - grilles essentielles EH et ESPC publiées en **v2**, les v1 archivées : leurs sessions restent consultables ;
  - 4 nouvelles grilles publiées en v1 ;
  - 2ᵉ exécution : « déjà à jour » pour les 6 grilles, ce qui prouve que le contenu en base est identique aux JSON.

### 8.3 Fonctionnalités

- [x] **Réponses « Présent / Absent / Observations »** à la place de « Oui / Non ».
  - « Observations » ouvre un champ de texte de 2 000 caractères au plus.
  - L'élément observé **n'est pas calculé** : il ne compte ni comme présent, ni comme absent.
  - Un critère dont tous les documents sont à « Observations » est exclu du dénominateur.
  - L'API refuse toute autre valeur (400). Les réponses `true` / `false` des sessions antérieures restent lues : true = présent, false = absent.
- [x] **Score selon la catégorie du critère** (règle ci-dessus). Les résultats et le PDF indiquent :
  - les critères partiellement respectés ;
  - les critères non calculés ;
  - les observations saisies.
- [x] **Reprise exacte** : la question affichée est enregistrée à chaque déplacement, côté serveur (`sessions_evaluation.position_question`) et dans le navigateur.
  - Au retour (« Continuer » ou rechargement), la session rouvre sur cette question.
  - Avant, elle rouvrait sur la 1ʳᵉ question sans réponse.
- [x] Boutons **« Précédent » / « Suivant »** (au masculin).
- [x] **Inscription unique** :
  - `/inscription` affiche directement le formulaire de l'établissement ;
  - l'option « Compte individuel » est retirée de la page et de « Comment ça marche » ;
  - les anciennes adresses `/inscription/individuel` et `/inscription/organisation` redirigent vers `/inscription`.
- [x] Grilles proposées dans l'ordre essentiels → fondamentaux → avancés.
- [x] Migrations, purement additives : `20261126100000_session_position_question` et `20261126110000_reponse_commentaire_texte` (commentaire VARCHAR(191) → TEXT). Elles sont appliquées sur `dps_bj`, et `migrate diff` est vide.

### 8.4 Tests

- [x] Unitaires : `scoring.util.spec.ts` + `grilles-ars.spec.ts`, **51/51**.
- [x] e2e : `auto-evaluation-conformite` + `grilles-ars-parcours`, **36/36**.
  - Le parcours couvre les 6 grilles officielles ; le score attendu est recalculé indépendamment dans le test.
  - Il vérifie aussi la position, les valeurs refusées, les observations et le PDF.
- [x] `tsc` API (seule subsiste l'erreur connue de `test/app.e2e-spec.ts`) et `tsc` web : sans erreur.
- [x] Build de production `next build --webpack` : code 0, TypeScript sans erreur, 79 pages.
- [x] **Navigateur réel** (27/11/2026) : Chrome headless avec un profil vierge, sur `next start` et l'API locale, avec un compte ESPC de test. **18/18 contrôles OK, 0 erreur JavaScript.**
  - Inscription : page unique, plus d'option « compte individuel », ancienne adresse redirigée.
  - Les 3 grilles ESPC sont proposées dans l'ordre ; aucune grille EH n'apparaît.
  - Boutons Présent / Absent / Observations et « Précédent » / « Suivant ».
  - « Observations » ouvre le champ de texte sans passer à la question suivante.
  - Reprise exacte à la question 5, via « Continuer » comme après un rechargement. Avant, la reprise se faisait à la 1ʳᵉ question sans réponse (la 4).
  - Réponses et texte d'observation conservés ; récapitulatif, soumission, puis page Résultats avec la section Observations.
  - Compte, sessions et réponses de test supprimés après le test.
- [x] **Correctif issu du test navigateur** : quand on quitte la page juste après un clic, l'enregistrement serveur de la position (2 à 5 s sur cette machine) pouvait ne pas aboutir. La position est donc aussi gardée dans le navigateur, et au retour la plus récente des deux l'emporte.
- Constat d'environnement : avec 4 Go de RAM, `next dev` (plus de 800 Mo) sature la machine et provoque des délais. Après une mise en veille, le pool de connexions de l'API reste bloqué jusqu'au redémarrage de l'API.

### 8.5 Points à faire valider (rien n'a été inventé)

- [!] **Seuil de 30 %** : le manuel dit « 31 à 79 % » pour 0,5 et « moins de 30 % » pour 0. Un résultat d'exactement 30 % est noté **0,5**, puisqu'il n'est pas « moins de 30 % ».
- [!] **Fiches des critères du manuel et tableau 7** : certaines fiches disent « tous les éléments = respecté, moins = partiellement ». La plateforme suit le tableau 7 et l'onglet Synthèse des Excel, où 80 % suffisent pour 1.
- [!] **« Sans objet »** : l'Excel le propose par critère. Ici, il est obtenu en mettant tous les documents du critère à « Observations ». Le même mécanisme s'applique aux critères essentiels, ce qui permet d'exclure un critère essentiel du calcul.
- [!] **Lignes à puces de l'Excel** : chaque ligne est un document à part, conformément au fichier. Exemples : ESPC A.1.1.4 « – les catastrophes naturelles ; » et C.1.1.3 « – restriction de leur utilisation ».
- [!] L'API d'inscription individuelle (`/auth/register/individuel`) est conservée : les comptes individuels existants continuent de fonctionner. Seule l'option d'inscription est retirée de l'interface.

