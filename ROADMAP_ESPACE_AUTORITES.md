# Feuille de route — Espace des autorités sanitaires (tableaux de bord)

Demande du 13/10/2026 : enrichir l'espace des comptes « zone sanitaire » avec plusieurs menus, des tableaux de bord, des statistiques, des graphiques, des filtres avancés, en responsive, à partir des données liées aux zones sanitaires. Un compte temporaire de zone sanitaire est créé et **conservé** tant que le client n'en demande pas la suppression.

Suite de `ROADMAP_RAPPORTS_STATISTIQUES.md` : les données exploitées sont **les rapports statistiques soumis** par les établissements du ressort et la **localisation** des établissements, rien d'autre.

## Légende

| Marque | Sens |
|---|---|
| `[x]` | Fait et vérifié. La preuve est indiquée. |
| `[ ]` | Reste à faire. |
| `[!]` | Décision du client attendue. Rien n'est inventé. |

## Règles appliquées

- **Ressort inchangé** (déjà en place) : la zone sanitaire voit les rapports soumis de sa zone et de son département ; la direction départementale ceux de son département ; le niveau national tous. Un brouillon n'est visible par aucune autorité.
- **Aucun indicateur inventé** : les graphiques reprennent les lignes et les colonnes imprimées sur les formulaires. Les seuls calculs ajoutés sont des sommes, des rapports simples entre deux cases du formulaire (ex. décès / cas) et des délais entre deux dates enregistrées. Leur formule est affichée à côté du chiffre.
- **Pas de seuil d'alerte, pas de date limite de transmission, pas de liste officielle des établissements attendus** : ces éléments ne figurent dans aucun document fourni (voir `[!]`).
- Aucune donnée d'un autre module (auto-évaluation, NEWS, EI, formations) n'est montrée aux autorités : ce n'est pas prévu par les décisions du 07/10/2026.

## Étapes

### Étape 0 — Analyse de l'existant
- [x] **0.1** Espace actuel : un seul menu « Rapports reçus » (liste filtrable par statut et formulaire, consultation, validation par la zone). API `GET /autorite/me`, `GET /autorite/rapports`, `GET /autorite/rapports/:id`, `POST /autorite/rapports/:id/valider`.
- [x] **0.2** Données exploitables : 6 formulaires décrits comme données (`packages/shared/src/rapports-statistiques`), valeurs par case `bloc.ligne.colonne`, cases calculées par `valeurCase`. Localisation des établissements : département, commune, arrondissement, zone sanitaire.
- [x] **0.3** Base de développement au 13/10 : 3 autorités fictives (ZS PAS, DDS Ouémé, Ministère), 13 établissements **sans localisation**, 2 rapports en brouillon, **aucun rapport soumis** → données de démonstration nécessaires pour tester (étape 2).
- [x] **0.4** Composants réutilisables : Recharts (`lib/chart-theme.ts`), `DataTable` (recherche, filtres à facettes, tri, export CSV, cartes mobiles), `StatCard`, `Card`, `Repartition`, `AppShell` / `SidebarNav` (groupes de menus repliables).

### Étape 1 — Compte temporaire de zone sanitaire
- [x] **1.1** Script `apps/api/prisma/compte-autorite-temporaire.ts creer | supprimer` : crée `zs-pas.temporaire@fictif.dsp.invalid`, rattaché à l'autorité « [FICTIF] Zone sanitaire PAS » (Ouémé). Mot de passe généré, communiqué au client dans la conversation, jamais écrit dans le dépôt. *Créé le 13/10.*
- [x] **1.2** Connexion vérifiée par l'API (13/10) : `/auth/login` 200 ; `/autorite/me` 200 (zone PAS, Ouémé) ; `/autorite/rapports` 200 ; `/sessions-evaluation` 403 (pas d'accès aux modules des établissements).
- [x] **1.3** Le compte **n'est pas supprimé** à la fin des tests (demande du client). `supprimer` n'est à lancer que sur demande.

### Étape 2 — Données de démonstration (pour tester)
- [x] **2.1** Script `apps/api/prisma/demo-autorites.ts creer | supprimer` (graine fixe, reproductible). Créé le 13/10 : **8 établissements « [DÉMO] … », 386 rapports** — 6 dans la zone PAS (Porto-Novo, Sèmè-Podji, Aguégués), 2 dans la zone AAKA (Adjarra, Avrankou) ; mensuels de janvier à septembre 2026, 12_BJ des semaines S27 à S41 ; ~10 % non transmis ; transfusion pour 2 établissements seulement ; anciens rapports validés, récents « à valider ». Cohérences élémentaires : positifs ≤ testés (PNLP1), servie ≤ demandée (transfusion). **Ce ne sont pas des données réelles.**
- [x] **2.2** Suppression vérifiée (« 8 établissements, 8 utilisateurs, 386 rapports. Restant : 0 »), puis recréation. Le compte temporaire voit les rapports de la zone PAS et pas ceux de AAKA.

### Étape 3 — API des tableaux de bord (`/autorite/...`)
- [x] **3.1** `GET /autorite/etablissements` : établissements localisés dans le ressort (même règle que les rapports) + ceux qui y ont transmis sans y être localisés ; rapports par statut, formulaires transmis, dernière soumission.
- [x] **3.2** `GET /autorite/synthese` : totaux (reçus, à valider, validés, non ouverts, établissements du ressort, établissements ayant transmis), par formulaire, par mois de soumission, délais (fin de période → soumission, soumission → réception, soumission → validation : nombre, moyenne, médiane), 8 plus anciens « à valider », dernière période complète de chaque formulaire.
- [x] **3.3** `GET /autorite/transmissions` : périodes commencées entre du et au (par défaut : 12 derniers mois ou 16 dernières semaines), matrice établissement × période, transmis / validés par période.
- [x] **3.4** `GET /autorite/donnees` : valeurs des indicateurs demandés (600 au maximum) pour chaque rapport filtré. Catalogue des indicateurs dans `packages/shared/src/rapports-statistiques/indicateurs.ts` (cases saisies et calculées, Oui/Non, champs nombre ; jamais une case hachurée, fusionnée ou un texte).
  - Filtres communs : `du`, `au` (début de période), `formulaire`, `statut`, `organisations`, `communes`, `structures`. Le ressort existant n'a pas été modifié : les méthodes `exigerAutorite` et `ressort` sont seulement devenues publiques.
- [x] **3.5** Tests (13/10) :
  - unitaires `src/rapports-statistiques` : **25/25** (dont 6 nouveaux : catalogue d'indicateurs, valeurs saisies / calculées / Oui/Non avec les chiffres de la photo PNLP1, périodes entre deux dates dont semaines ISO et passage d'année 2026-S53, délais, ressort d'un établissement) ;
  - e2e `test/autorite-tableaux-de-bord.e2e-spec.ts` : **5/5** (403 pour un compte établissement ; ressort ZS / DDS Ouémé / DDS Zou / national ; brouillon jamais compté ; totaux, filtres date / commune / type de structure ; matrice ; cases calculées 41 et 70 ; refus des cases inconnue, hachurée, fusionnée, texte, et au-delà de 600) ;
  - `tsc --noEmit` API : OK (seule erreur restante, antérieure : `test/app.e2e-spec.ts`).

### Étape 4 — Navigation et filtres communs (web)
- [x] **4.1** Menus groupés (`components/rapports-statistiques/autorite-shell.tsx`) : Pilotage (Tableau de bord, Rapports reçus, Suivi des transmissions, Établissements), Analyses (Épidémiologie (BS-a), Surveillance hebdomadaire, Paludisme (PNLP1), Maladies non transmissibles, Transfusion sanguine), Outils (Explorateur d'indicateurs), Compte (Mon autorité, Déconnexion). 12 entrées au lieu d'une ; écran de chargement et page d'erreur ajoutés.
- [x] **4.2** Barre de filtres (`components/autorite/filtres-barre.tsx`, `lib/autorite-filtres.ts`), état dans l'URL : période (3 / 6 / 12 derniers mois, année en cours, toutes, dates choisies), établissements (multi-sélection avec recherche), communes, type de structure, statut ; puces des filtres actifs, « Tout réinitialiser ». Chaque page peut y ajouter ses sélecteurs (formulaire, rubrique, variable).
- [x] **4.3** « Rapports reçus » en `/autorite/rapports` ; `/autorite` = tableau de bord. Fil d'Ariane du rapport et revalidation après validation mis à jour.
- Composants communs : graphiques (`graphiques.tsx` : barres verticales / horizontales / empilées, courbes, aires, anneau ; légende cliquable pour masquer une série ; libellés raccourcis selon la largeur), séries au choix de l'utilisateur (`series-selectionnables.tsx`), tableau générique (`tableau-donnees.tsx`, sur `DataTable` : recherche, facettes, tri, colonnes affichables, export CSV, cartes mobiles), matrice des transmissions.

### Étape 5 — Pages
- [x] **5.1** Tableau de bord : chiffres clés, rapports à valider, réception par mois (graphique), répartition par formulaire, transmissions du dernier mois par formulaire, délais.
- [x] **5.2** Rapports reçus : `DataTable` (recherche, filtres formulaire / statut / établissement / commune / période, tri, export CSV, cartes mobiles).
- [x] **5.3** Suivi des transmissions : matrice colorée établissement × période, taux « établissements ayant transmis / établissements du ressort » (formule affichée).
- [x] **5.4** Établissements : liste + fiche (identité, localisation, historique des rapports, transmissions par formulaire).
- [x] **5.5** Épidémiologie (BS-a) : cas et décès par affection, classement, évolution mensuelle, âge et sexe, hospitalisés / non hospitalisés, cas référés, consultants.
- [x] **5.6** Surveillance hebdomadaire (12_BJ) : courbe hebdomadaire par maladie (suspects, décès, confirmés), situation des décès, flambées, paludisme hebdomadaire.
- [x] **5.7** Paludisme (PNLP1) : cas testés / positifs (TDR, GE), paludisme grave, décès, CTA, ruptures de stock par produit.
- [x] **5.8** Maladies non transmissibles (PNLMNT 1 et 2) : dépistage, complications, prise en charge, femmes enceintes, cécité, santé mentale, accidents de la voie publique.
- [x] **5.9** Transfusion sanguine : PSL demandés / servis, receveurs par âge et sexe, services, affections, effets indésirables receveurs.
- [x] **5.10** Explorateur d'indicateurs : n'importe quelle case de n'importe quel formulaire, regroupée par période / établissement / ligne / colonne, en barres, courbe ou tableau, export CSV.

### Étape 6 — Vérifications
- [x] **6.1** `tsc --noEmit` API et web, eslint sur les fichiers modifiés. *12/11* : `tsc` web 0 erreur ; `tsc` API : seule l'erreur antérieure `test/app.e2e-spec.ts` ; eslint (fichiers web du commit `3472b35`) 0 problème ; oxlint (fichiers API du commit) 0 erreur, 1 avertissement `no-misused-spread` (`autorite-statistiques.service.ts:216`, copie du DTO de filtres dans un objet simple : seuls ses champs sont lus, sans effet).
- [x] **6.2** Test réel dans Chrome (headless, CDP) avec le compte temporaire : chaque page, chaque filtre, 0 erreur JS ; largeur bureau et mobile (390 px), captures contrôlées. *13/11* (Chrome, compte temporaire) : les 12 pages + fiche établissement + détail d'un rapport, **0 erreur JS** ; 1366 px : 0 débordement ; 390 px (cadre de 390 px, même origine) : 0 débordement après correction. Filtres vérifiés : période (raccourci et dates choisies), commune, statut, type de structure, établissement, combinés dans l'URL (puces affichées), « Tout réinitialiser ». Défauts trouvés et corrigés : voir Journal du 13/11.
- [x] **6.3** Non-régression : e2e `rapports-statistiques` existant. *12/11, après D6* : **14/14** (268 s). *Avant D6* : `autorite-tableaux-de-bord` **5/5** ; `rapports-statistiques` **12/14** — les 2 échecs sont des **429** sur `/auth/login` (limite D9 : 5 connexions / 60 s par IP), pas une assertion métier : le fichier connecte 7 comptes différents et la base a répondu plus vite que le 07/10 (14/14), donc 7 connexions en moins de 60 s. Lancés seuls, ces tests ne sont pas exploitables (ils dépendent du rapport créé par les tests précédents). Voir **D6**.

## Décisions attendues du client `[!]`

- [!] **D1** Liste officielle des établissements attendus par formulaire (ex. le rapport transfusion ne concerne que les structures agréées) : sans elle, le taux de transmission est calculé sur les établissements de la plateforme localisés dans le ressort, et c'est écrit à l'écran.
- [!] **D2** Date limite de transmission (promptitude) : non fournie. Seul le délai mesuré (fin de période → soumission) est affiché, sans jugement « à temps / en retard ».
- [!] **D3** Seuils d'alerte épidémique (12_BJ, BS-a) : non fournis. Aucun seuil ni alerte automatique.
- [!] **D4** Accès des autorités aux autres données des établissements (scores d'auto-évaluation, EI…) : non prévu, non fait.
- [!] **D5** Suppression des données de démonstration de l'étape 2 : à faire dès que le client a terminé ses essais. *Au 12/11 : toujours en base (8 établissements, 390 rapports : 244 validés, 146 soumis). Les scripts `demo-autorites.ts` et `compte-autorite-temporaire.ts` ont été perdus : la suppression devra être réécrite.*
- [x] **D6** e2e `rapports-statistiques` : faut-il adapter le test (attendre la fin de la fenêtre de 60 s quand `/auth/login` répond 429) ? La limite de production n'est pas à modifier. *Décidé le 12/11 : adapter le test.* Fait : `connecter()` attend la durée de l'en-tête `Retry-After` (60 s à défaut) puis réessaie une fois ; délai des tests du fichier porté à 120 s. Limite de production inchangée.
- [x] **D7** Test réel 6.2 : le mot de passe du compte temporaire n'est écrit nulle part dans le dépôt (communiqué au client le 13/10). Il faut soit le recevoir, soit autoriser sa réinitialisation (le client devra alors utiliser le nouveau). *Décidé le 12/11 : réinitialiser.* Fait le 12/11 par un script temporaire (supprimé après usage) : nouveau hash bcrypt (12 tours, comme l'application), sessions du compte révoquées. Nouveau mot de passe communiqué dans la conversation, jamais écrit dans le dépôt.

## Journal

- **13/10/2026** : étape 0 faite (analyse).
- **13-14/10/2026** : étapes 1 à 4 faites ; les 12 pages de l'étape 5 sont écrites. `tsc` web : 0 erreur ; eslint sur les nouveaux fichiers : 0 problème.
  - Test réel dans Chrome headless (compte temporaire, 1366 px), **0 erreur JS, 0 débordement** : tableau de bord, rapports reçus, transmissions, établissements, épidémiologie, surveillance, paludisme, MNT, transfusion, explorateur (2 configurations).
  - Défauts trouvés sur les captures et corrigés :
    - axes absents et barres horizontales vides : les axes étaient dans des fragments React, que Recharts 2 ne lit pas ;
    - graduations coupées : notation compacte (« 20 k ») ;
    - tableaux trop larges : colonnes secondaires masquées par défaut, et option `entetesMultilignes` ajoutée à `DataTable` (désactivée par défaut, autres tableaux inchangés) ;
    - colonne par défaut de l'explorateur : la colonne « Total ».
  - Données de démonstration rendues plausibles (cases majoritairement à 0, maladies du 12_BJ rares) et régénérées : 390 rapports.
  - **Reste à tester** : « Mon autorité », fiche établissement, détail d'un rapport, filtres combinés dans l'URL, largeur mobile 390 px, non-régression e2e `rapports-statistiques`. Test interrompu : machine saturée (≈ 470 Mo libres, compilation d'une page > 20 min).
- **12/11/2026** : 6.1 fait. 6.3 : 5/5 et 12/14 (2 échecs 429, voir D6). Compte temporaire et données de démonstration vérifiés en base (lecture seule). 6.2 en attente de D7 ; machine : ≈ 715 Mo libres sur 4 Go.
- **13/11/2026** : D7 appliqué (mot de passe du compte temporaire réinitialisé par un script temporaire supprimé après usage, sessions révoquées ; **compte conservé**, non supprimé). 6.2 fait, étape 5 cochée.
  - Défauts trouvés et corrigés :
    - 390 px : débordement horizontal (jusqu'à 755 px) sur le tableau de bord et la transfusion — grilles sans colonne explicite sous `xl` : la colonne implicite `auto` prenait la largeur des textes tronqués. `grid-cols-1` ajouté (`autorite/page.tsx` : 3 grilles ; `transfusion/page.tsx` : 3 grilles) ;
    - MNT, « Évolution mensuelle » : 2 courbes de même couleur (couleur = rang dans le catalogue modulo 10 : v4 et v54). Couleur désormais selon le rang parmi les séries choisies (`series-selectionnables.tsx`) ;
    - Paludisme, axe vertical : « 4,5 k » coupé. Largeur de l'axe 44 → 52 px (`graphiques.tsx`, barres et courbes).
  - `tsc` web 0 erreur ; eslint sur les 4 fichiers modifiés : 0 problème.
  - Constats non corrigés (aucune décision à inventer) :
    - données de démonstration : décès BS-a non plafonnés par les cas (décès / cas = 66,2 %) ; aucune donnée après S41 / septembre, d'où « 0 / 6 » en « Dernière période complète » (octobre). La formule est juste (somme des lignes « Décès » du formulaire) ; les scripts de démonstration ayant été perdus (D5), les données ne sont pas régénérées ;
    - jeton d'accès de 15 min sans renouvellement silencieux (choix V1, `proxy.ts`) : à l'expiration, une page de l'espace répond 500 (erreur API 401 dans le layout) au lieu de renvoyer vers la connexion, tant que le cookie n'a pas expiré (écart de quelques secondes en production ; jusqu'à 2 min ici, la connexion ayant duré 2 min pendant la compilation).
  - `next dev` (Turbopack) ne compile plus depuis `E:\ARCHIVE` (`@swc/helpers` introuvable, `apps/web` ayant son propre `.git`) : lancé avec `next dev --webpack`, comme le 12/10. Machine saturée (≈ 300 Mo libres, une page jusqu'à 8,5 min de compilation) : serveur web redémarré une fois.
