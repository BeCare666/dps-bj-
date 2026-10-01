# DASHBOARD_PREMIUM_ROADMAP.md — dps.bj

Évaluation des dashboards (admin + établissement) par rapport au niveau demandé par le client le 2026-09-30 : **« ultra luxueux, ultra premium, professionnel et naturel, niveau plateformes haut de gamme, pas de rendu générique »**, avec en priorité des **tables comme sur les meilleures plateformes** (filtres avancés propres, responsive, boutons d'action).

Distinct de `ROADMAP.md` (backend/CDC) et de `FRONTEND_REDESIGN_PROGRESS.md` (phases 0 à 5 déjà faites). Ce document est la **Phase 6** de la refonte frontend : il ne contient que l'analyse et le plan, **aucun code n'a été modifié**.

Statuts : `NOT_STARTED` · `IN_PROGRESS` · `BLOCKED` · `COMPLETED`.

---

## 1. Méthode et limites

- **Analyse faite sur le code réel** (2026-09-30) : les 2 sidebars, les 39 `page.tsx` des groupes `(admin)` et `(app)`, `components/ui/data-table.tsx`, les 8 tables admin, les listes établissement, les dashboards, les pages de détail, et les DTO de filtres de l'API (`apps/api/src/**/dto/list-*-query.dto.ts`).
- **Pas de vérification visuelle** : l'extension Chrome n'était pas connectée. L'évaluation porte sur la structure, les composants et les classes CSS, qui déterminent le rendu. Elle rejoint le constat visuel du client (« rendus simples, génériques »).
- Référence « haut niveau » retenue : le niveau déjà choisi explicitement par le client en Phase 5 (**Linear / Vercel / Stripe**). Les critères ci-dessous traduisent ce niveau en éléments vérifiables, pas en impressions.

---

## 2. Verdict global

| Critère | Niveau actuel (/5) | Constat (preuve dans le code) |
|---|---|---|
| Coquille (sidebar, header, footer) | **3,5** | Refaite en Phase 5 (`shell/app-shell.tsx`) : fixe, repliable, recherche Ctrl+K, menu profil. C'est la partie la plus aboutie. |
| **Tables de données** | **2** | Une seule table générique (`ui/data-table.tsx`) : recherche texte + tri + « Précédent/Suivant ». Pas de filtres avancés, pas de puces de filtres, pas de sélection, pas de menu d'actions par ligne, pas de choix de colonnes ni de densité, pas de taille de page, pas d'état dans l'URL. Sur mobile, simple défilement horizontal (`min-w-[640px]`). |
| **Listes côté établissement** | **1,5** | **Aucune** page établissement n'utilise de table : EI, patients NEWS, alertes NEWS, réservations, sessions d'auto-évaluation sont des piles de cartes (`.map()` → `<Link>` bordé), **sans recherche, filtre ni pagination**. |
| En-têtes de page | **1,5** | **13 pages admin sur 20 n'ont aucun titre visible** (`h1` absent, le shell n'en affiche pas) : elles commencent par un paragraphe gris (ex. `admin/utilisateurs/page.tsx` : « N utilisateurs sur la plateforme. »). Pas de fil d'Ariane (`Breadcrumb` créé en Phase 2, **utilisé nulle part**), pas de zone d'actions standard. |
| Dashboard admin (accueil) | **2** | 4 `StatCard` (libellé + nombre), un donut et un bar chart « catalogue actif/inactif » (`admin/page.tsx`). Titre « Bonjour 👋 ». Pas de section « à traiter », pas d'activité récente, pas de tendance. |
| Dashboard établissement | **1,5** | 4 cartes-liens vers les modules (`(app)/tableau-de-bord/page.tsx`), un seul chiffre (dernier score). Aucun indicateur, aucun graphique, aucune alerte à traiter, alors que les endpoints existent. |
| Analytics admin | **1,5** | 4 cartes + 6 listes « libellé … nombre » en texte (`admin/analytics/page.tsx`). Aucun graphique, alors que Recharts est déjà installé. |
| Tableau de bord EI | **1,5** | 3 chiffres + listes texte par statut et par gravité (`evenements-indesirables/tableau-de-bord/page.tsx`). |
| Boutons d'action | **2** | Boutons texte bordés isolés (`Désactiver`, `Fixer la date RDV`, `Clôturer`, `Voir`). Pas de menu contextuel (`Dropdown` créé en Phase 2, **inutilisé**), pas d'icônes, pas d'actions groupées. |
| Pages de détail | **2** | Titre + cartes empilées dans une colonne étroite (`max-w-3xl`). Pas d'onglets (`Tabs` **inutilisé**), pas de panneau latéral de synthèse, pas de chronologie. |
| États de chargement | **2** | Un `loading.tsx` générique par groupe de routes. `Skeleton` créé, **utilisé nulle part** : pas de squelette de table ni de carte. |
| États vides | **2** | Paragraphe en pointillés recopié dans chaque page. `EmptyState` utilisé seulement dans les `not-found.tsx`. Pas de distinction « aucune donnée » / « aucun résultat pour ces filtres ». |
| Cohérence de mise en page | **2** | Largeurs de contenu hétérogènes : `max-w-2xl` (4), `3xl` (4), `4xl` (6), `6xl` (3) côté établissement, `1400px` côté admin. Les listes établissement sont bridées à `4xl` (≈ 900 px), trop étroites pour des tables. |
| Finition visuelle (profondeur, typo chiffres) | **2** | Toutes les surfaces ont le même style (`border + bg-surface + p-6`). Pas de chiffres tabulaires (`tabular-nums`), pas de hiérarchie de surfaces, couleurs des graphiques codées en dur (`dashboard-charts.tsx`) au lieu des tokens. |

**Niveau global estimé : ≈ 2 / 5**, soit « propre mais générique ». Le shell est au niveau attendu. **Le contenu des pages ne l'est pas**, en particulier les tables, les listes établissement et les dashboards. Le constat du client est fondé.

---

## 3. Écarts réels trouvés (hors esthétique)

1. **Désactivation sans confirmation dans les listes admin.**
   - Constat : `admin/utilisateurs-table.tsx` et `admin/etablissements-table.tsx` ont chacun leur propre `BoutonBasculer` (`useActionState`), qui désactive **directement**, sans `ConfirmDialog` ni toast.
   - Contradiction : la Phase 4 indique que ces actions passent par `ConfirmDialog`. C'est vrai uniquement pour les boutons des **pages de détail** (`toggle-*-button.tsx`), pas pour ceux des listes.
2. **Filtres disponibles dans l'API mais inexploités par l'interface** (vérifié dans les DTO) :

   | Liste | Filtres API existants | Utilisés par l'UI |
   |---|---|---|
   | Utilisateurs | `organisationId`, `role`, `actif` | aucun (recherche texte seule) |
   | Établissements | `type`, `actif` | aucun |
   | EI | `statut`, `gravite`, `serviceId`, `typeEiId` | aucun |
   | Patients NEWS | `statut`, `serviceId` | aucun (séparation codée en dur) |
   | Alertes NEWS | `statut`, `niveauRisque` | `statut=OUVERTE` en dur |
   | Grilles | `type`, `statut` | aucun |
   | Audit | `organisationId`, `utilisateurId`, `entite`, `action` | aucun |
   | Réservations | `statut` | oui (un `<select>`) |

3. **Endpoint `GET /sessions-evaluation/evolution` (évolution des scores) jamais appelé par le front.** C'est un graphique de tendance déjà disponible pour le dashboard établissement.
4. **Pas de dimension temporelle dans `GET /analytics`** (`AnalyticsPlateforme` = uniquement des totaux). Des tendances ou variations « vs période précédente » sur les KPI admin **nécessitent une évolution de l'API** (voir §6).
5. **Journal d'audit plafonné à 200 entrées** (`audit.service.ts`, `LIMITE = 200`), sans pagination serveur. Au-delà, les entrées anciennes sont inaccessibles depuis l'interface.
6. **Duplication** : la fonction `silencieux()` est recopiée dans **22 pages**, et le badge de statut actif/inactif est recopié à la main dans plusieurs tables et pages de détail au lieu d'utiliser `ui/badge.tsx`.

---

## 4. Évaluation menu par menu

### Admin

| Menu | Rendu actuel | Niveau | Ce qui manque pour le niveau visé |
|---|---|---|---|
| Tableau de bord | 4 StatCard + donut + barres | 2 | En-tête réel, bloc « À traiter » (alertes ouvertes, réservations payées sans date RDV), activité récente (audit), KPI avec icône et contexte, graphiques sur tokens |
| Alertes | DataTable sans titre ni filtre | 2 | En-tête, filtres module/niveau/statut en puces, lien direct vers l'établissement, tri par ancienneté par défaut, mise en évidence des niveaux élevés |
| Analytics | Cartes + listes texte | 1,5 | Graphiques (répartitions en barres/donuts), mise en page en grille éditoriale, (tendances : dépend de l'API) |
| Audit | DataTable + modale JSON brut | 2 | Filtres acteur/action/établissement/période, détail avant/après **lisible** (diff champ par champ) au lieu du JSON, pagination serveur |
| Établissements | DataTable, bouton texte | 2 | Filtres type/statut, colonnes utilisateurs/date, menu d'actions (Voir, Désactiver avec confirmation), sélection |
| Fiche établissement | Colonne `3xl`, cartes empilées | 2 | En-tête d'entité (avatar, statut, actions), onglets (Aperçu, Utilisateurs, Activité), compteurs en bandeau |
| Utilisateurs | DataTable, bouton texte | 2 | Filtres rôle/établissement/statut, avatar à initiales, menu d'actions, confirmation |
| Fiche utilisateur | Idem fiche établissement | 2 | Idem : en-tête d'entité, onglets (Profil, Rôles, Sessions, Activité) |
| Rôles & permissions | Cartes avec puces de codes techniques | 1,5 | **Matrice rôles × permissions** (table à cases), libellés lisibles au lieu des codes bruts |
| Réservations | DataTable + select statut | 2,5 | Filtres en puces avec compteurs, montant total filtré, menu d'actions, export |
| Formations | DataTable | 2 | En-tête avec action « Nouvelle formation », filtres statut, menu d'actions |
| Types d'EI | DataTable | 2 | Idem |
| Grilles | DataTable | 2 | Filtres type/statut, badges de version |
| Intégrations | Liste de cartes | 2 | Cartes « santé » avec logo/icône, indicateur d'état, date de dernière vérification |
| Paramètres | Formulaires empilés | 2 | Mise en page type « réglages » (libellé à gauche, contrôle à droite, sections) |
| Sécurité | 2 cartes + table brute | 2 | Même mise en page « réglages », table au style commun |
| Profil / Mes sessions | Formulaire / liste | 2 | Mise en page « réglages » commune avec les paramètres |

### Établissement

| Menu | Rendu actuel | Niveau | Ce qui manque pour le niveau visé |
|---|---|---|---|
| Tableau de bord | 4 cartes-liens | 1,5 | KPI réels (alertes NEWS ouvertes, EI non qualifiés / gravité élevée, dernier score, patients hospitalisés), graphique d'évolution des scores (endpoint existant), bloc « À traiter », état des abonnements |
| Auto-évaluation | Listes de cartes (en cours / grilles / soumises) | 2 | Historique en table (date, grille, score, auteur), graphique d'évolution |
| NEWS (patients) | Cartes + historique en liste | 1,5 | Table patients avec recherche, filtre statut/service, dernier score et niveau de risque, action « Nouvelle mesure » par ligne |
| Alertes NEWS | Liste de cartes | 1,5 | Table avec filtres statut/niveau, tri par ancienneté, actions par ligne |
| Événements indésirables | Liste de cartes `4xl` | 1,5 | Table avec recherche, filtres statut/gravité/service/type (tous existants dans l'API), bandeau « à qualifier » cliquable qui applique le filtre |
| Tableau de bord EI | 3 chiffres + listes texte | 1,5 | Graphiques par statut/gravité, KPI mis en forme, export intégré à l'en-tête |
| Formations (catalogue) | Page vitrine partagée | 2,5 | (hors dashboard, déjà refaite côté marketing) |
| Mes réservations | Liste de cartes `3xl` | 1,5 | Table (formation, formule, montant, statut, RDV), filtre statut |
| Mon établissement | Formulaire | 2 | Mise en page « réglages » |
| Profil / Paramètres | Formulaire / liste | 2 | Mise en page « réglages » commune |

---

## 5. Standard cible (ce que « haut niveau » veut dire ici, de façon vérifiable)

### 5.1 Table de données « premium » (remplace `ui/data-table.tsx`)
- **Barre d'outils** : recherche avec icône et raccourci, bouton « Filtres » ouvrant des filtres par colonne (choix multiple avec compteurs), **puces des filtres actifs** supprimables une par une, « Réinitialiser ».
- **Vues rapides en onglets** avec compteurs (ex. EI : Tous · À qualifier · En traitement · Clôturés).
- **État dans l'URL** (recherche, filtres, tri, page) : partageable, conservé au retour arrière.
- **En-têtes** collants, tri avec icônes, **choix des colonnes visibles**, **densité** (confortable/compacte).
- **Lignes** : clic sur la ligne vers le détail, **menu d'actions « ⋯ »** (Voir, Modifier, Désactiver…) avec icônes, actions destructives toujours via `ConfirmDialog` + toast.
- **Sélection multiple** + **barre d'actions groupées** : uniquement là où une action groupée existe réellement dans l'API (à ne pas inventer, voir §6).
- **Pagination** : « 1 à 10 sur 57 », choix de la taille de page, numéros de page.
- **États** : squelette de table au chargement ; état vide « aucune donnée » (avec action principale) distinct de « aucun résultat pour ces filtres » (avec « Réinitialiser »).
- **Mobile** : bascule automatique en **liste de cartes** (pas de défilement horizontal), filtres dans un panneau plein écran.
- **Export CSV de la vue filtrée** là où il a du sens (réservations, audit, EI existe déjà côté API).
- **Chiffres** alignés à droite en `tabular-nums`, montants et dates formatés de façon homogène.

### 5.2 En-tête de page (nouveau composant `PageHeader`, utilisé partout)
Fil d'Ariane · titre · description courte · actions (principale + secondaires) · onglets optionnels. **Aucune page sans titre.**

### 5.3 Dashboards
- **KPI** : icône, libellé, valeur (`tabular-nums`), contexte ; variation/tendance **seulement si l'API la fournit** (§6).
- **Bloc « À traiter »** en tête : uniquement des éléments réels et actionnables, chacun avec son lien.
- **Graphiques** sur les tokens de couleur (plus de couleurs codées en dur), avec infobulles et légendes soignées.
- **Activité récente** (admin : journal d'audit).

### 5.4 Pages de détail
En-tête d'entité (identité, statut, actions), onglets, colonne principale + panneau latéral de synthèse, chronologie quand l'historique existe (ex. transitions EI, RM8).

### 5.5 Finition
Hiérarchie de surfaces (fond, carte, carte en relief), bordures et ombres plus fines, rythme vertical constant, largeur de contenu unique pour les pages de liste (pleine largeur utile), micro-interactions sobres (survol, focus visible), `tabular-nums`, icônes cohérentes dans les boutons.

---

## 6. Dépendances API (à ne pas contourner côté front)

| Besoin | Existe ? | Conséquence |
|---|---|---|
| Filtres des listes (§3.2) | **Oui** | Faisable sans toucher à l'API |
| Évolution des scores d'auto-évaluation | **Oui** (`/sessions-evaluation/evolution`) | Faisable sans toucher à l'API |
| Tendances / variations des KPI (admin, EI, NEWS) | **Non** (`/analytics` = totaux) | Nouvel endpoint ou nouveaux champs nécessaires → **décision client** |
| Pagination serveur (audit > 200, gros volumes) | **Non** (tout est chargé puis paginé côté client) | Suffisant aux volumes actuels ; audit limité à 200 → **décision client** |
| Actions groupées (désactiver N utilisateurs…) | **Non** (endpoints unitaires uniquement) | Soit boucle d'appels unitaires, soit endpoint dédié, soit pas de sélection multiple → **décision client** |
| Filtre par période (dates) sur les listes | **Non**, sauf export EI (`debut`/`fin`) | Filtrage côté client possible sur les données déjà chargées, ou ajout API → **décision client** |

---

## 7. Plan d'exécution (Phase 6)

Chaque étape : build + typage, puis **vérification visuelle réelle** (desktop + mobile) avant de passer à la suivante.

| Étape | Contenu | Statut |
|---|---|---|
| **6.0** | Décisions client sur le §6 et le §8 | `COMPLETED` (options prudentes, voir §9) |
| **6.1** | Fondations : `PageHeader` (+ `Breadcrumb` existant), largeurs de page unifiées, `silencieux()` factorisé, `StatCard` v2, tokens de graphiques, `tabular-nums`, hiérarchie de surfaces | `COMPLETED` (typage + lint ; build et visuel : voir §9) |
| **6.2** | `DataTable` v2 (tout le §5.1) + mode cartes mobile + état dans l'URL + squelettes | `COMPLETED` (typage + lint ; build et visuel : voir §9) |
| **6.3** | Migration des 8 tables admin vers v2 + **correction du §3.1** (confirmation sur les désactivations des listes) | `COMPLETED` (typage + lint ; build et visuel : voir §9) |
| **6.4** | Conversion des 5 listes établissement (EI, patients, alertes NEWS, réservations, historique auto-évaluation) en tables v2, avec les filtres API existants | `COMPLETED` (typage + lint + build ; visuel : voir §9) |
| **6.5** | Dashboards : accueil admin, accueil établissement (KPI réels + évolution des scores), tableau de bord EI, Analytics en graphiques | `COMPLETED` (typage + lint ; build groupé ; visuel : voir §9) |
| **6.6** | Pages de détail : en-tête d'entité + onglets (établissement, utilisateur, EI, patient, réservation) ; audit avec détail avant/après lisible | `COMPLETED` (typage + lint ; build groupé ; visuel : voir §9) |
| **6.7** | Pages « réglages » (paramètres, sécurité, profil, sessions, mon établissement, intégrations) + matrice rôles × permissions | `COMPLETED` (typage + lint ; build : voir §9) |
| **6.8** | Passe finale : responsive complet, accessibilité clavier/focus, cohérence, vérification visuelle de tous les menus | `IN_PROGRESS` (code fait et buildé ; **vérification visuelle bloquée**, voir §9) |
| 6.9 *(si validé en 6.0)* | Évolutions API : tendances KPI, pagination serveur audit, actions groupées, filtre de période | `NOT_STARTED` |

**Ordre recommandé** : 6.1 et 6.2 d'abord, parce que tout le reste en dépend. Ensuite 6.3 et 6.4 (les tables, priorité du client), puis 6.5 à 6.8.

---

## 8. Décisions à prendre par le client avant de démarrer

1. **Tendances des KPI** (« +12 % vs mois dernier », mini-courbes) : faut-il faire évoluer l'API (6.9) ? Sans cela, les KPI restent des valeurs instantanées.
2. **Actions groupées** (sélection multiple) : les veut-on, et pour quelles listes ? Elles nécessitent soit des endpoints dédiés, soit des appels unitaires en série.
3. **Audit** : lever la limite de 200 entrées avec une pagination serveur ?
4. **Filtre par période** sur les listes : côté client (données déjà chargées) ou côté API ?
5. **Mode sombre** : reste hors périmètre (décision de la Phase 1), ou fait partie du « premium » attendu ?
6. **Vérification visuelle** : il faut l'extension Chrome connectée et les identifiants du compte organisation de test, à chaque étape.

---

## 9. Journal d'exécution

### 6.0 — Décisions (2026-09-30) — `COMPLETED`

Consigne client du 2026-09-30 : avancer étape par étape sans redemander le feu vert, sans improviser, sans rien casser. Les décisions du §8 n'ayant pas été tranchées, **l'option prudente (aucun nouvel endpoint, aucune fonctionnalité inventée) est appliquée** ; chacune reste réversible si le client en décide autrement :

1. Tendances des KPI : **non**. Les KPI affichent des valeurs instantanées réelles ; pas de faux « +x % ». Seule tendance affichée : l'évolution des scores d'auto-évaluation (endpoint déjà existant).
2. Actions groupées / sélection multiple : **non** (aucun endpoint groupé). Actions par ligne uniquement.
3. Audit : **limite de 200 conservée**, signalée clairement dans l'interface.
4. Filtre par période : **non** pour l'instant (aucun support API sur les listes).
5. Mode sombre : **reste hors périmètre** (décision de la Phase 1 inchangée).
6. Vérification visuelle : faite dès que l'extension Chrome est connectée ; en attendant, chaque étape est validée par typage + build.

### 6.1 — Fondations (2026-09-30) — `COMPLETED`

- `lib/api-server.ts` : `silencieux()` centralisé ; **21 copies identiques retirées** des pages (diff vérifié : seul le bloc et l'import changent). La variante différente de `(app)/tableau-de-bord` (retour `null`) est conservée jusqu'à sa réécriture en 6.5.
- `components/ui/page-header.tsx` (nouveau) : fil d'Ariane, sur-titre, titre, description, actions. **Appliqué aux 13 pages admin qui n'avaient aucun titre visible** ; les descriptions reprennent mot pour mot les textes d'introduction existants.
- `components/ui/page-container.tsx` (nouveau) : mêmes marges et largeur maximale que le conteneur d'`AdminShell`. **Décision** : pas de déplacement des marges dans le shell établissement, car le questionnaire d'auto-évaluation dépend de ses propres marges (marges négatives + éléments collants) ; le conteneur est appliqué page par page lors de leur refonte (6.4 à 6.7).
- `components/ui/card.tsx` : `Card` avec relief discret (`--shadow-card`, nouveau token), `CardHeader` (nouveau), `StatCard` v2 (icône + ton, lien optionnel, `tabular-nums`, rétrocompatible).
- `lib/chart-theme.ts` (nouveau) : couleurs et styles des graphiques alignés sur les tokens (remplacera les couleurs codées en dur en 6.5).
- `components/ui/dropdown.tsx` : fermeture par Échap, contenu pouvant refermer le menu (rétrocompatible ; composant jusqu'ici inutilisé).
- `lib/use-preference-locale.ts` (nouveau) : préférence locale via `useSyncExternalStore`, même principe que la sidebar (pas d'erreur d'hydratation ni de `setState` dans un effet).
- Icônes ajoutées : menu « ⋯ », filtre, colonnes, tri, pagination, voir, désactiver, activer, export, densité, boîte vide, calendrier, crayon, archive, copie, envoi.

### 6.2 — Table de données v2 (2026-09-30) — `COMPLETED`

`components/ui/data-table.tsx` réécrit (mêmes noms d'export) : vues rapides en onglets avec compteurs ; recherche avec icône ; filtres à choix multiple avec **compteurs de facettes** (calculés en excluant le filtre concerné) ; puces des filtres actifs supprimables + « Tout réinitialiser » ; tri avec icônes (tri « aucun » explicite conservé dans l'URL) ; menu « Affichage » (densité confortable/compacte + colonnes visibles, mémorisés par viewer) ; clic sur la ligne vers le détail (Ctrl/Cmd+clic : nouvel onglet ; ignoré sur liens/boutons ou si du texte est sélectionné) ; **menu d'actions « ⋯ » rendu en portail à position fixe** (jamais rogné par le défilement de la table, s'ouvre vers le haut près du bas de l'écran, fermeture Échap / clic extérieur / défilement) ; pagination « 1 à 10 sur N », taille de page, numéros avec ellipses ; en-têtes collants sous le header (grands écrans) ; **mode cartes sur mobile** (plus de défilement horizontal) ; état vide « aucune donnée » distinct de « aucun résultat » (avec réinitialisation) ; export CSV de la vue filtrée (BOM UTF-8, séparateur « ; » pour Excel fr) ; état (recherche, vue, filtres, tri, page, taille) **synchronisé dans l'URL via `history.replaceState`**, donc sans rechargement serveur ; `DataTableSkeleton` pour les chargements. Aucun appel API ajouté.

### 6.3 — Tables admin (2026-09-30) — `COMPLETED`

- 8 tables migrées : utilisateurs, établissements, formations, types d'EI, grilles, réservations, alertes plateforme, audit.
- **Correction §3.1** : nouveau hook `components/admin/use-action-confirmee.tsx`. Toute désactivation depuis une liste passe désormais par `ConfirmDialog` + toast (utilisateurs, établissements, **et aussi formations et types d'EI**, qui étaient dans le même cas). Textes de confirmation repris des boutons de la Phase 4 quand ils existaient ; les nouveaux ont été vérifiés contre l'API (formation et type d'EI inactifs réellement exclus du catalogue et de la déclaration).
- Grilles : publication confirmée (non modifiable ensuite, vérifié dans `grilles.service.ts`) et archivage confirmé (définitif, aucune action inverse dans l'API).
- Filtres proposés : uniquement des dimensions réellement présentes dans les données (rôle, type de compte, type d'établissement, formule, niveau, statut, action, entité). Journal d'audit : **3 actions réellement tracées par l'API n'avaient pas de libellé** (`etablissement.modifier_coordonnees`, `parametre.modifier`, `utilisateur.modifier_profil`), ajoutées.
- Avatars à initiales (utilisateurs), icônes d'entité, montants et dates en `tabular-nums`, liens croisés (utilisateur ↔ établissement, audit → acteur/établissement, réservation → établissement).

**Tests 6.1 à 6.3** : `tsc --noEmit` exit 0. ESLint sur tous les fichiers touchés : aucune erreur nouvelle (restent 1 erreur et 2 avertissements **préexistants** : `dashboard-charts.tsx`, réécrit en 6.5, et deux `_prevState` inutilisés). Build : groupé en fin de 6.4. **Vérification visuelle : impossible pour l'instant** (extension Chrome non connectée ; le mot de passe admin de test du 22/09 a été changé depuis, et le mot de passe du compte admin réel n'est pas réinitialisé sans accord).

### 6.4 — Listes établissement (2026-09-30) — `COMPLETED`

- Nouvelles tables (DataTable v2) : `ei/evenements-table.tsx`, `news/patients-table.tsx`, `news/alertes-table.tsx`, `reservations/mes-reservations-table.tsx`, `auto-evaluation/historique-table.tsx`.
- Colonnes limitées aux champs **réellement renvoyés** par chaque endpoint (vérifié dans les services API) : EI avec type et service (`include: { typeEi, service }`), alertes avec patient et score de la mesure (`include: { patient, mesure }`), réservations avec formation, sessions avec grille. **Patients : pas de nom de service** (aucun endpoint des services n'existe ; non inventé).
- Vues et filtres : EI (Tous / À qualifier / Déclarés / En traitement / Clôturés ; filtres gravité, type, service construits à partir des données présentes), patients (Hospitalisés par défaut / Sortis / Tous, remplace les deux listes séparées), alertes (statut en vues, risque en filtre), réservations (Toutes / À venir / En attente de paiement / Réalisées).
- Pages `evenements-indesirables`, `news`, `news/alertes`, `mes-reservations`, `auto-evaluation` passées sur `PageContainer` + `PageHeader` (même largeur et mêmes marges que l'admin). Tous les textes, boutons, bandeaux et contrôles de rôle existants sont conservés ; ajout d'un bouton « Alertes » dans l'en-tête NEWS (page existante, jusqu'ici accessible seulement par le bandeau) et d'un fil d'Ariane sur les alertes.
- Auto-évaluation : sessions en cours et grilles disponibles en grille de cartes, historique en table avec barre de score. **Correction en cours de route** : une coloration vert/orange/rouge du score avec des seuils 75/50 avait été écrite puis **retirée**, car aucun seuil n'existe dans le CDC ni dans l'API (barre monochrome).

**Tests 6.4** : `tsc --noEmit` exit 0 ; ESLint sans erreur nouvelle (2 erreurs et 8 avertissements `_prevState` **préexistants**, dans des fichiers non modifiés) ; **`next build` exit 0** (serveurs de dev arrêtés pour la RAM puis relancés ; compilation 6.9 min + TypeScript 73 s ; **48 pages, identique** au build précédent).

### 6.5 — Dashboards (2026-09-30) — `COMPLETED`

Règle appliquée partout : **uniquement des valeurs réelles issues d'endpoints existants** ; un bloc dont l'appel est refusé (rôle ou module non souscrit) **n'est pas affiché** (jamais de faux « 0 »).

- **Accueil admin** (`(admin)/admin/page.tsx`) : en-tête « Bonjour, {prénom} » avec la date du jour ; 4 indicateurs cliquables (établissements actifs, utilisateurs actifs, montant encaissé — même formule qu'avant —, alertes ouvertes NEWS + EI graves) ; bloc **« À traiter »** (réservations payées à planifier, alertes NEWS, EI graves, chacun menant à la liste **déjà filtrée** via `?vue=`) ; **activité récente** (7 dernières entrées du journal d'audit, en chronologie) ; réservations par statut (anneau avec total au centre), utilisateurs par rôle, EI par gravité. Retirés de l'accueil : les cartes « Formations actives » / « Types d'EI actifs » et le graphique « catalogue actif/inactif » (information toujours disponible dans Analytics, Formations et Types d'EI).
- **Analytics** : les 6 listes texte deviennent des répartitions en barres (`components/ui/repartition.tsx`, nouveau, rendu serveur) ; 4 `StatCard`. Utilisateurs par rôle **sans pourcentage** (un utilisateur peut cumuler plusieurs rôles : un pourcentage de la somme serait trompeur, barre relative au maximum).
- **Tableau de bord EI** : 4 indicateurs (dont « À qualifier », calculé sur la liste), répartitions par statut (cliquables vers la vue filtrée), par gravité et **par service** (`parService` était renvoyé par l'API mais jamais affiché ; noms de service repris de la liste des EI), liste des 5 événements graves non clôturés. L'export CSV reste un lien classique `<a>` (route de téléchargement, jamais préchargée par `next/link`).
- **Accueil établissement** : en-tête (nom, type, date) ; indicateurs affichés selon les droits réels (alertes NEWS ouvertes, patients hospitalisés, événements en cours dont à qualifier, dernier score) ; bloc **« À traiter »** (4 dernières alertes NEWS ouvertes avec patient, score et ancienneté ; EI graves non clôturés ; EI à qualifier pour les rôles de traitement ; auto-évaluations en cours) ; bloc **Modules** avec l'état d'abonnement (même logique de badge qu'avant) ; **graphique d'évolution des scores** (`GET /sessions-evaluation/evolution`, existant mais jamais utilisé jusqu'ici). Compte individuel : page « Bienvenue » limitée aux formations (le compte individuel n'a accès à aucun module établissement).
- Graphiques sur `lib/chart-theme.ts` (plus de couleurs codées en dur). Libellés d'audit déplacés dans `lib/audit-libelles.ts` (un composant serveur ne peut pas lire une constante exportée par un fichier `"use client"`). `lib/format.ts` : `formaterDateCourte`, `formaterIlYa`.

**Tests 6.5** : `tsc --noEmit` exit 0 ; ESLint sur les 10 fichiers touchés : **0 problème** (l'erreur préexistante de `dashboard-charts.tsx` a disparu avec sa réécriture).

### 6.6 — Pages de détail (2026-09-30) — `COMPLETED`

Toutes les fiches : fil d'Ariane, titre avec badges d'état, actions dans l'en-tête, mise en page principale + colonne latérale (grands écrans), `ListeProprietes` (`components/ui/fiche.tsx`, nouveau). **Tous les formulaires, boutons et contrôles de rôle existants sont conservés à l'identique** (seul leur emplacement change).

- **Fiche établissement (admin)** : 4 indicateurs, carte « Coordonnées », onglets **Utilisateurs** (table v2 des utilisateurs de l'établissement) et **Activité** (journal d'audit de l'établissement). Données via les filtres `organisationId` **déjà acceptés par l'API** (`/utilisateurs`, `/audit`). `UtilisateursTable`/`AuditTable` : props optionnelles `idTable` / `synchroniserUrl` (rétrocompatibles) pour ne pas écrire l'état de ces tables dans l'URL de la fiche.
- **Fiche utilisateur (admin)** : avatar à initiales, carte « Informations » (**type de compte désormais en clair** : il s'affichait brut, ex. `ORGANISATION`), carte « Rôles » (retrait et ajout inchangés), onglets **Sessions** et **Activité** (actions effectuées, filtre `utilisateurId` existant).
- **Fiche EI** : qualification / traitement en cartes dédiées, causes, actions correctives, pièces jointes ; colonne « Synthèse » (dont le **critère d'auto-évaluation lié**, RM10, renvoyé par l'API mais jusqu'ici non typé ni affiché : ajouté comme champ optionnel dans `lib/types.ts`) et **chronologie** (déclaration + transitions avec libellés, au lieu des codes bruts `DECLARE → EN_TRAITEMENT`). L'auteur de chaque transition n'est pas affiché : l'API ne renvoie que son identifiant.
- **Fiche patient** : 3 indicateurs (dernier score, nombre de mesures, admission), **graphique d'évolution du score NEWS** (mesures déjà chargées, ordre chronologique vérifié dans `patients.service.ts`), historique en table v2 (le **niveau de conscience**, présent dans les données mais jamais affiché, est disponible en colonne ; libellés repris du formulaire de saisie), formulaire de nouvelle mesure en colonne latérale.
- **Fiche alerte NEWS** : constantes de la mesure déclencheuse en tuiles, interventions en chronologie, carte « Prise en charge ».
- **Fiche réservation** : **frise de progression** déduite du seul statut (réservée → payée → rendez-vous fixé → réalisée), carte « Suivi » (mêmes messages et même bouton KKiaPay qu'avant), « Récapitulatif » (formule, montant, facture, rendez-vous).
- **Détail d'audit** : tableau champ par champ avant / après, champs modifiés mis en évidence ; JSON brut toujours consultable.
- `components/ui/tabs.tsx` : compteur optionnel par onglet (rétrocompatible ; composant jusqu'ici inutilisé).

**Tests 6.6** : `tsc --noEmit` exit 0 ; ESLint : 0 erreur (2 avertissements `_prevState` préexistants dans des fichiers non modifiés).

### 6.7 — Pages de réglages (2026-09-30) — `COMPLETED`

- `components/ui/section-reglage.tsx` (nouveau) : intitulé et explication à gauche, contenu à droite (empilés sur mobile). Les formulaires existants gardent leur propre carte (pas de double encadrement).
- Appliqué à : profil (admin + établissement), sessions (admin « Mes sessions », établissement « Paramètres »), mon établissement, paramètres plateforme, sécurité. Formulaires et textes inchangés ; une phrase non vérifiable (« s'applique immédiatement ») a été retirée des paramètres avant publication.
- Sécurité : durées de session en tuiles, table de limitation de débit au style commun avec **mode cartes sur mobile**.
- Intégrations : grille de cartes avec pastille d'état (animée seulement si « vérifié en direct : opérationnel »), compteur « N / total configurés » (un premier libellé « en service » a été corrigé : il comptait aussi des services seulement configurés, jamais vérifiés).
- **Rôles & permissions : matrice rôles × permissions**, groupée par domaine, avec résumé du nombre de permissions par rôle. Lignes = toutes les permissions attribuées à au moins un rôle dans `ROLE_PERMISSIONS` (`@dps/shared`). Libellés = traduction directe des deux parties du code `DOMAINE_ACTION` (ex. `READ` → « Consulter »), le code restant affiché à côté.

**Tests 6.7** : `tsc --noEmit` exit 0 ; ESLint sur tous les fichiers touchés : 0 problème.

### Bug détecté en usage réel et corrigé (2026-09-30)

Le journal du serveur de dev montre une navigation réelle par le client sur `/admin/etablissements`, `/admin`, `/admin/alertes`, `/admin/utilisateurs` (toutes en HTTP 200), avec un avertissement React : **`<a>` imbriqué dans `<a>` → erreur d'hydratation**. Cause : en **mode cartes mobile**, `DataTable` enveloppait la première colonne dans un lien alors que cette colonne contient déjà un lien. **Corrigé** : plus de lien englobant ; la carte entière est cliquable par le même gestionnaire que les lignes de table (les liens et boutons internes gardent leur propre comportement). Également appliqué : `data-scroll-behavior="smooth"` sur `<html>` (recommandation Next.js signalée dans le même journal, sans effet visuel).

### 6.8 — Passe finale (2026-09-30) — `IN_PROGRESS`

Fait :
- **Cohérence** : les 6 dernières pages sans en-tête commun passent sur `PageHeader` + fil d'Ariane : nouveau patient, déclarer un EI, réserver une formation, nouvelle grille, fiche grille (badge de statut coloré), **résultats d'auto-évaluation** (3 indicateurs, score par domaine, écarts regroupés par domaine). Seul le questionnaire d'auto-évaluation garde volontairement sa mise en page propre (navigation latérale collante).
- **Textes** : règle du client respectée : aucun tiret dans les textes visibles (la pagination « 1–10 » devient « 1 à 10 ») et aucune référence technique (une mention « (RM1) » retirée avant publication).
- **Accessibilité** : anneau de focus clavier global (`:focus-visible`) sur liens, boutons, onglets et éléments de menu ; rôles ARIA sur onglets, menus et cases de filtre ; `aria-busy` sur les squelettes.
- **Chargement** : `loading.tsx` admin et établissement passent d'un spinner à un **squelette de page** (en-tête, indicateurs, table).
- **Responsive (par construction)** : tables en cartes sous 768 px, grilles d'indicateurs 1 → 2 → 4 colonnes, fiches en une colonne puis deux sur grand écran, tables système avec variante mobile.

**Tests** : `tsc --noEmit` exit 0 ; **ESLint sur tout `apps/web/src` : 0 erreur** (les 2 erreurs préexistantes, `reserver/[formationId]` et `dashboard-charts.tsx`, ont disparu avec les réécritures) et 8 avertissements `_prevState` préexistants ; **`next build` exit 0** (compilation 3.0 min, TypeScript 66 s, **48 pages, identique à avant la Phase 6**). Serveurs de dev arrêtés pour chaque build puis relancés.

**Reste pour clore 6.8 (bloqué, dépend du client)** : vérification visuelle réelle, desktop + mobile, de tous les menus admin et établissement. Il faut **l'extension Chrome connectée** et **des identifiants de test** (le mot de passe admin de test du 22/09 a été changé ; aucun identifiant de compte établissement disponible). En attendant, la navigation réelle du client est surveillée dans le journal du serveur de dev (c'est ainsi que le bug `<a>` imbriqué a été trouvé et corrigé).
