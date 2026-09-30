# FRONTEND_AUDIT.md — dps.bj

Audit Phase 0 de la refonte frontend (voir prompt maître fourni le 2026-09-22). Basé sur une inspection réelle du code au 2026-09-22 (état après D8.2). Aucune modification de code effectuée pendant cette phase — lecture seule, conformément à la règle §6 du prompt maître.

Contexte : ce chantier de refonte est **distinct** de `ROADMAP.md` (backend + fonctionnalités métier, phases D0–D12 + D8) et distinct de `FRONTEND_REDESIGN_PROGRESS.md` (journal de progression de ce chantier, créé séparément).

---

## 1. Architecture actuelle

- **Framework** : Next.js 16 (App Router, Turbopack), React 19. `apps/web/AGENTS.md` avertit explicitement que les conventions peuvent différer des connaissances standard (`middleware.ts` → `proxy.ts` déjà rencontré).
- **4 groupes de routes** dans `app/` : `(marketing)`, `(auth)`, `(app)`, `(admin)` — chacun avec son propre `layout.tsx`, et donc son propre système de navigation/shell (voir §4, incohérence majeure).
- **Styling** : Tailwind CSS v4 via `@import "tailwindcss"` + `@theme inline` dans `app/globals.css`. Pas de fichier `tailwind.config.*` séparé (config CSS-first native à Tailwind v4). Tokens définis en variables CSS (`:root`) : couleurs (bg/surface/border/text/primary/accent/success/warning/danger + variantes `-soft`), 2 rayons (`--radius-md`, `--radius-lg`), 1 ombre (`--shadow-soft`). **Thème clair uniquement**, aucun `prefers-color-scheme`/dark mode.
- **Polices** : `--font-body` / `--font-display` référencées mais leur déclaration (`next/font`) n'a pas été inspectée dans ce passage — à vérifier dans `app/layout.tsx`.
- **Auth/session** : JWT décodé côté serveur sans vérification de signature (`lib/session.ts`, `decoderPayloadJwt`) — confort d'affichage uniquement, documenté comme tel. `lib/proxy.ts` fait une vérification optimiste (présence du cookie `access_token`) sur une liste blanche de préfixes protégés.
- **Permissions** : catalogue partagé `packages/shared/src/index.ts` (5 rôles, 25 permissions, `ROLE_PERMISSIONS`, `resoudrePermissions`, `aLaPermission`) consommé à la fois par l'API (autorité réelle) et le web (`lib/session.ts` → `aRole()`/`aPermission()`, affichage uniquement).
- **Appels API** : `lib/api-server.ts` (`apiFetch`/`apiFetchJson`), toujours serveur-à-serveur (Server Components/Server Actions), jamais d'appel direct depuis le navigateur vers l'API NestJS (sauf 2 routes relais `app/api/*/route.ts` pour contourner le scope de cookie, documentées dans ROADMAP.md). Un seul point de polling client (`notifications-bell.tsx`, 45s).
- **Actions serveur** : un fichier `lib/*-actions.ts` par domaine (`auth-actions`, `admin-actions`, `organisation-actions`, `ei-actions`, `patients-actions`, `reservations-actions`, `grilles-actions`, `notifications-actions`, `parametres-actions`, `session-actions`) — convention cohérente et bien respectée, chacun avec son propre type d'état local (`EtatFormulaire`/`EtatAction`, quasi-identiques mais dupliqués par fichier, voir §5).
- **Animation** : `motion` (Framer Motion successeur) via un seul composant `components/motion/reveal.tsx`, plus quelques usages ad hoc (`AnimatePresence` dans `Modal`, `ProfileMenu`, `AdminShell`, `SiteHeader`).
- **Icônes** : un seul fichier `components/icons.tsx`, SVG faits main, un seul style cohérent (stroke 1.6, `currentColor`, `strokeLinecap/Linejoin round`). Point fort, pas une lacune.

## 2. Pages existantes (classées)

**Public (marketing)**
- `/` (accueil), `/a-propos`, `/formations` (catalogue), `/formations/[id]` (fiche détail)

**Authentication**
- `/login`, `/inscription` (choix), `/inscription/individuel`, `/inscription/organisation`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/verification-email`

**Onboarding**
- Aucune page dédiée distincte de l'inscription — pas de flux d'accueil/configuration initiale après création de compte.

**Organisation (établissement)**
- `/tableau-de-bord` (dashboard établissement), `/organisation` (D8.1, auto-édition coordonnées, réservé RESPONSABLE_COMPTE)

**Utilisateur (self-service, tout type de compte)**
- `/mes-sessions` (D8.2, auto-gestion sessions), `/mes-reservations`, `/mes-reservations/[id]`

**Qualité / Soins (métier organisation)**
- Auto-évaluation : `/auto-evaluation`, `/auto-evaluation/[id]`, `/auto-evaluation/[id]/resultats`
- NEWS : `/news`, `/news/[id]`, `/news/nouveau`, `/news/alertes`, `/news/alertes/[id]`
- EI : `/evenements-indesirables`, `/evenements-indesirables/[id]`, `/evenements-indesirables/nouveau`, `/evenements-indesirables/tableau-de-bord`

**Formation**
- `/reserver/[formationId]` (réservation, protégée) — catalogue public listé plus haut

**Administration (ADMIN_PLATEFORME, groupe `(admin)`)**
- `/admin` (dashboard), `/admin/alertes`, `/admin/analytics`, `/admin/audit`, `/admin/etablissements`, `/admin/etablissements/[id]`, `/admin/formations`, `/admin/grilles`, `/admin/grilles/[id]`, `/admin/grilles/nouveau`, `/admin/integrations`, `/admin/mes-sessions` (D8.2), `/admin/parametres`, `/admin/reservations`, `/admin/roles`, `/admin/securite`, `/admin/types-ei`, `/admin/utilisateurs`, `/admin/utilisateurs/[id]`

**Paramètres**
- `/admin/parametres` (paramètre plateforme unique, `duree_essai_module_jours` — voir ROADMAP.md D8) ; `/organisation` fait aussi office de "paramètres organisation" sans être nommé ainsi.

**Autres**
- `/api/evenements-indesirables/export-csv`, `/api/notifications-internes` (routes relais Next, pas des pages), `/robots.txt`, `/sitemap.xml`

**44 routes générées au total** (confirmé par la sortie de `next build` du 2026-09-22).

## 3. Composants réutilisables (inventaire réel)

`components/ui/` ne contient que **4 primitives** :
- `Button` (3 variantes : primary/secondary/ghost, gère `disabled` et un état `href` pour rendu en `<Link>`, pas d'état `loading` intégré — chaque appelant gère `pending` séparément via `useFormStatus`)
- `DataTable<T>` (recherche, tri par colonne, pagination client, message vide configurable — solide et générique, mais **utilisé uniquement côté `(admin)`**, jamais côté `(app)`)
- `Modal` (Échap, clic-dehors, scroll verrouillé, `AnimatePresence`)
- `Field` / `SelectField` (input/select labellisés)

**Composants transverses en dehors de `ui/`** : `Reveal` (motion), `SubmitButton` (wrapper `useFormStatus` autour de `Button`), `icons.tsx`.

**Aucun composant générique pour** : Textarea, Checkbox, Radio, Switch, DatePicker, Badge/StatusBadge générique, Tooltip, Alert, Toast, Card/StatCard générique, Tabs, Dropdown (hors `ProfileMenu` ad hoc), Drawer (hors panneau mobile ad hoc de `AdminShell`), ConfirmDialog, Skeleton, EmptyState, ErrorState, LoadingState, Breadcrumb, Avatar, SearchFilterBar, CommandMenu. Tout ce qui existe aujourd'hui pour ces besoins est **recréé localement, par page ou par domaine métier** (voir §5).

## 4. Problèmes identifiés

1. **Trois implémentations de header/navigation indépendantes**, sans shell commun :
   - `components/marketing/site-header.tsx` (sticky+blur, menu mobile en accordéon animé, `NAV_LINKS` local)
   - `components/app-shell/app-header.tsx` (statique, nav horizontale scrollable sur mobile, pas de menu hamburger, `NAV_LINKS_ORGANISATION`/`NAV_LINKS_ADMIN` locaux)
   - `components/admin/admin-shell.tsx` + `admin-sidebar.tsx` + `profile-menu.tsx` + `notifications-bell.tsx` (sidebar rétractable, recherche visuelle non fonctionnelle, notifications réelles, menu de profil)
   Trois systèmes de nav différents, trois façons de définir une liste de liens, aucune primitive de layout partagée.

2. **`AppHeader` (organisation) ne distingue pas compte ORGANISATION vs INDIVIDUEL** — `NAV_LINKS_ORGANISATION` (6 liens, dont Auto-évaluation/NEWS/EI/Mon établissement) s'affiche identiquement à un compte individuel qui n'a accès à aucun de ces modules métier. Écart UX réel, pas seulement esthétique.

3. **`proxy.ts` — liste blanche de routes protégées incomplète** : `PREFIXES_PROTEGES` ne contient ni `/organisation` (ajouté D8.1) ni `/mes-sessions` (ajouté D8.2 aujourd'hui). Un visiteur non connecté sur `/mes-sessions` déclenche un `ApiError` non catché (401 de l'API, aucun `error.tsx` défini) au lieu d'une redirection propre vers `/login`. `/organisation` s'en sort indirectement (redirection interne vers `/tableau-de-bord`, lui-même protégé) mais avec un aller-retour inutile. Risque de régression à surveiller si la Phase 3 touche au shell/à la navigation — corriger `PREFIXES_PROTEGES` en même temps.

4. **Aucun état loading/error/empty/not-found systématique** — confirmé : zéro fichier `loading.tsx`, `error.tsx` ou `not-found.tsx` dans tout `app/**`. Chaque page gère (ou pas) ses erreurs au cas par cas via un helper local `silencieux()`/`aRole()` + `redirect()`, dupliqué page par page (voir §5). Aligné avec le constat déjà écrit dans ROADMAP.md §10.11.

5. **Responsive jamais reconfirmé visuellement** (ROADMAP.md §10.12) — les classes Tailwind responsive sont posées mais leur rendu réel à largeur mobile n'a jamais été vérifié avec succès par l'outil d'automatisation navigateur disponible dans les sessions précédentes.

6. **Dashboard organisation très sommaire vis-à-vis du prompt maître** : `tableau-de-bord/page.tsx` est 4 cartes de navigation statiques + badges de statut d'abonnement. Aucun KPI d'activité, aucune section "attention"/actions requises, aucune activité récente — à l'opposé de l'architecture cible décrite en Phase 6 du prompt maître. Le dashboard admin (`admin/page.tsx`) est plus riche (4 StatCards + 2 graphiques `recharts`) mais reste une vue "compteurs + charts", sans section actions/attention non plus.

## 5. Incohérences / Duplications

- **7 badges de statut quasi identiques, dans 3 fichiers séparés**, tous avec le même moule (`rounded-full px-2.5 py-1 text-xs font-semibold` + `Record<Enum, string>` styles + `Record<Enum, string>` libellés), jamais factorisés en un `StatusBadge` générique : `ei/badges.tsx` (`GraviteBadge`, `StatutEiBadge`, `StatutActionBadge`), `news/badges.tsx` (`RisqueBadge`, `StatutAlerteBadge`, `StatutPatientBadge`), `reservations/badges.tsx` (`StatutReservationBadge`). Plus un 8ᵉ badge de statut équivalent codé en dur et non extrait, `StatutAbonnementBadge` dans `(app)/tableau-de-bord/page.tsx`.
- **`components/admin/sessions-list.tsx` vs `components/comptes/mes-sessions-list.tsx`** (introduit aujourd'hui, D8.2) — quasi-duplication délibérée (documentée dans ROADMAP.md D8.2 comme un choix conscient pour ne pas toucher un composant admin déjà testé) : même markup, même logique `estActive()`, seule différence = la Server Action appelée (`revoquerSessionAction(utilisateurId, sessionId)` vs `revoquerMaSessionAction(sessionId)`) et la présence/absence du paramètre `utilisateurId`. Candidat naturel de factorisation en Phase 2 (composant paramétré par une fonction `onRevoke(sessionId)` plutôt que par deux Server Actions distinctes).
- **`StatCard` défini localement dans `(admin)/admin/page.tsx`**, non extrait vers `components/ui/`, donc non réutilisable par un futur dashboard organisation (Phase 6) sans copier-coller.
- **Deux types d'état de formulaire quasi identiques** : `EtatFormulaire { erreur? }` (`auth-actions.ts`) et `EtatAction { erreur?; succes? }` (`admin-actions.ts`, et maintenant aussi dans `auth-actions.ts` depuis D8.2) — pattern répété plutôt qu'un seul type partagé dans `lib/types.ts`.
- **Pattern `silencieux()`/`repli` (avaler une `ApiError` et retourner `null`/une valeur de repli) réimplémenté indépendamment** dans plusieurs pages (`tableau-de-bord/page.tsx`, `admin/page.tsx`, `admin/layout.tsx` au minimum) au lieu d'un helper partagé dans `lib/api-server.ts`.
- **Patrons de tableau divergents entre espace organisation et espace admin** (déjà noté dans ROADMAP.md §10.6, confirmé ici) : cartes empilées côté organisation (patients, EI, réservations personnelles) vs `DataTable` générique côté admin — choix documenté comme délibéré (volumes faibles vs élevés), mais aucune primitive commune ne couvre les deux cas (pas de "liste compacte mobile-first" générique).

## 6. Lacunes UX

- Aucun fil d'Ariane (breadcrumb) nulle part — les pages de détail (`admin/utilisateurs/[id]`, `admin/etablissements/[id]`, `news/[id]`, `evenements-indesirables/[id]`, `auto-evaluation/[id]`) n'ont qu'un simple lien "← Retour" texte, pas de composant `Breadcrumb` cohérent.
- Aucun état vide "pédagogique" formalisé : les messages vides existants (`videMessage` de `DataTable`, "Aucune session enregistrée.") sont de simples phrases, jamais structurés en "pourquoi / quoi faire" comme l'exige la Phase 19 du prompt maître.
- Pas de `Toast`/notification transitoire pour confirmer une action réussie (création, activation, révocation…) — le seul retour est soit une `revalidatePath` silencieuse, soit un message d'erreur inline en cas d'échec ; aucun accusé de succès visible pour une action qui réussit.
- Formulaires non structurés en étapes/sections pour les workflows importants (inscription organisation notamment) — a priori un formulaire plat (non vérifié ligne à ligne dans cette passe, mais aucun composant `Stepper`/`Wizard` n'existe dans l'inventaire de composants).

## 7. Lacunes UI

- Absence quasi totale de composants "état" (`Skeleton`, `LoadingState`, `ErrorState`, `EmptyState` génériques) — voir §4.4.
- Pas de `Tooltip` — aucune aide contextuelle disponible nulle part dans l'inventaire de composants.
- Pas de `ConfirmDialog` générique — les actions destructives/sensibles (désactiver un établissement, révoquer une session, retirer un rôle) déclenchent l'action directement au clic sur un bouton, sans étape de confirmation intermédiaire (`toggle-organisation-button.tsx`, `toggle-utilisateur-button.tsx`, `BoutonRevoquer` des deux listes de sessions — à vérifier composant par composant en Phase 2, mais aucun `Modal` de confirmation n'est visiblement câblé dessus).
- Dark mode totalement absent (thème clair unique) — non nécessairement une lacune si le choix reste assumé (déjà documenté comme un choix délibéré), mais à trancher explicitement dans la Phase 1 (Design System) plutôt que de rester implicite.

## 8. Lacunes dashboard

- Dashboard organisation (§4.6) : pas de KPI d'activité réelle, pas de section "attention"/actions requises, pas de fil d'activité récente — uniquement 4 cartes de navigation statiques.
- Dashboard admin : compteurs + 2 graphiques, mais pas de section "actions nécessitant intervention" ni de fil d'activité récente plateforme (l'audit existe en tant que page séparée, `/admin/audit`, mais n'est pas résumé sur l'accueil admin).
- Aucun dashboard n'est différencié par rôle au sein d'une même organisation (RESP_QUALITE, PERSONNEL_SOIGNANT, GESTIONNAIRE_FORMATION voient tous le même `tableau-de-bord/page.tsx`) — cohérent avec l'état actuel de la roadmap (pas encore demandé), mais c'est explicitement l'objet de la Phase 7 du prompt maître.
- Stats plateforme agrégées NEWS/EI : déjà documenté comme bloqué côté API (ROADMAP.md D0.L) — à ne pas tenter de contourner côté frontend.

## 9. Risques de régression à surveiller pendant la refonte

- **RBAC/permissions frontend = confort d'affichage uniquement, jamais une couche de sécurité** (`aRole()`/`aPermission()`, `lib/session.ts`) — toute refonte de navigation doit continuer à masquer sans jamais supposer qu'un masquage suffit ; l'autorisation réelle reste `RolesGuard`/`PermissionsGuard` côté API.
- **Isolation multi-tenant (RM7)** — aucune page frontend ne doit jamais accepter un `organisationId`/`utilisateurId` cible depuis un état client non revérifié ; les patterns existants (`/organisations/me`, `/auth/me/sessions`) scopent déjà correctement côté API — à préserver strictement si ces appels sont refactorés en Phase 5/9.
- **`proxy.ts`** — toute nouvelle route protégée doit être ajoutée à `PREFIXES_PROTEGES` (voir bug déjà identifié en §4.3) ; un oubli dégrade l'UX (erreur brute) sans être un vrai trou de sécurité (l'API reste protégée), mais reste une régression visible à éviter.
- **Composants admin déjà testés/vérifiés visuellement** (ROADMAP.md §10, dashboard admin "coquille pro" vérifié en navigateur réel à deux reprises) — toute refonte du shell admin doit repartir de cet acquis, pas le reconstruire de zéro sans repasser par une vérification visuelle équivalente.
- **Machine de développement à ~4 Go de RAM** — toute Phase impliquant des dépendances supplémentaires (librairie de composants, icônes, animations) doit peser le coût `npm install`/`next build` avant de les ajouter (cf. `recharts`, déjà validé explicitement avec l'utilisateur en amont).

## 10. Éléments à conserver

- Convention `lib/*-actions.ts` par domaine + `useActionState`/`useFormStatus`/`SubmitButton` — cohérente, bien respectée partout, à garder comme fondation des futurs formulaires.
- Iconographie (`components/icons.tsx`) — un seul style, cohérent, à étendre plutôt qu'à remplacer.
- `DataTable` générique (`components/ui/data-table.tsx`) — solide techniquement (tri/recherche/pagination), à étendre (sélection, actions groupées, colonnes responsive) plutôt qu'à réécrire.
- `Modal` — Échap/clic-dehors/scroll-lock déjà corrects, bonne base pour un futur `Drawer`/`ConfirmDialog`.
- Pattern de scoping serveur-à-serveur (`apiFetch`/`apiFetchJson`, jamais d'appel direct navigateur→API) — architecture saine, à conserver telle quelle.
- Palette de couleurs santé (blanc/bleu/rose) — déjà un choix assumé et validé explicitement par l'utilisateur (rejet d'une V1 sombre/or jugée "faite par l'IA", voir ROADMAP.md §5.9) ; la Phase 1 doit la formaliser en design tokens plus complets, pas la remplacer.

## 11. Éléments à refactorer

- Les 3 headers/shells (§4.1) → unifier derrière une architecture de shell commune (Phase 3), sans casser les redirections/permissions déjà correctes de chacun.
- Les 8 badges de statut dupliqués (§5) → `StatusBadge` générique paramétré par variante sémantique (success/warning/danger/neutral/info), les badges métier deviennent de fins wrappers qui mappent leur enum vers une variante.
- `sessions-list.tsx` / `mes-sessions-list.tsx` → composant unique paramétré par un callback de révocation.
- `StatCard` local à `admin/page.tsx` → extraire vers `components/ui/`, réutilisable par le futur dashboard organisation.
- `EtatFormulaire`/`EtatAction` → un seul type partagé dans `lib/types.ts`.
- `PREFIXES_PROTEGES` dans `proxy.ts` → corriger l'oubli `/organisation` + `/mes-sessions` dès que la Phase touchant au shell/routing s'en occupe.

## 12. Éléments à créer

Composants fondamentaux absents et réellement nécessaires (Phase 2) : `Badge`/`StatusBadge`, `Card`/`StatCard`, `Tabs`, `Dropdown` générique, `ConfirmDialog`, `Skeleton`, `EmptyState`, `ErrorState`, `LoadingState`, `Breadcrumb`, `Toast`, `Tooltip`. Conventions transverses Next.js absentes (Phase 3/13) : `loading.tsx`/`error.tsx`/`not-found.tsx` par groupe de routes au minimum.

**Ne pas créer** (rappel §7 du prompt maître, aucune base métier/API actuelle) : dashboards par rôle avec des données qui n'existent pas encore côté API (ex. stats NEWS/EI agrégées plateforme, déjà bloquées côté backend), tout module de messagerie (écarté explicitement en ROADMAP.md §10.13), toute page "paramètres avancés" sans contenu réel défini.
