# FRONTEND_REDESIGN_PROGRESS.md — dps.bj

Journal de progression de la refonte frontend (prompt maître fourni le 2026-09-22). Distinct de `ROADMAP.md` (backend + fonctionnalités métier CDC, phases D0–D12 + D8) et de `FRONTEND_AUDIT.md` (audit Phase 0, référencé ci-dessous, non dupliqué ici).

Statuts : `NOT_STARTED` · `IN_PROGRESS` · `BLOCKED` · `COMPLETED`.

---

## Phase 0 — Audit complet

**Statut : COMPLETED** (2026-09-22)

**Travail réalisé** : inspection réelle de `apps/web/src/**` (routing, layouts, composants, lib, actions serveur, CSS) et `packages/shared`. Voir `FRONTEND_AUDIT.md` pour le détail complet (architecture, pages classées, inventaire de composants, incohérences, duplications, lacunes UX/UI/dashboard, risques de régression, éléments à conserver/refactorer/créer).

**Fichiers modifiés** : aucun (audit en lecture seule, conforme à la règle §6 du prompt maître). `FRONTEND_AUDIT.md` créé.

**Constats principaux** (résumé, détail dans `FRONTEND_AUDIT.md`) :
1. Trois shells de navigation indépendants (`site-header`, `app-header`, `admin-shell`), aucune primitive de layout commune.
2. `components/ui/` ne contient que 4 primitives (Button, DataTable, Modal, Field) — tout le reste recréé localement.
3. 8 badges de statut quasi identiques dupliqués dans 3+ fichiers, jamais factorisés.
4. Zéro `loading.tsx`/`error.tsx`/`not-found.tsx` dans toute l'app.
5. **Bug réel trouvé** : `proxy.ts` ne protégeait ni `/organisation` (D8.1) ni `/mes-sessions` (D8.2) — corrigé immédiatement (voir Phase 1, fichiers modifiés).
6. Dashboards (organisation et admin) très en retrait de l'architecture cible du prompt maître (Phases 6/7/11) : pas de section "attention"/actions requises, pas de fil d'activité, aucune différenciation par rôle.

**Critères de sortie** : rapport produit à partir d'une inspection réelle du code (pas d'invention), aucune modification massive pendant cette phase. → Satisfaits.

---

## Phase 1 — Design System

**Statut : IN_PROGRESS** (2026-09-22) — implémentation faite, build en cours de vérification.

**Décision de méthode** : le système de tokens Tailwind v4 CSS-first existant (`app/globals.css`, palette santé blanc/bleu/rose déjà validée explicitement par l'utilisateur — voir `ROADMAP.md` §5.9) est **conservé et étendu**, pas remplacé — conforme à `FRONTEND_AUDIT.md` §10 ("éléments à conserver") et à la règle §1 du prompt maître (ne rien inventer sans base réelle).

**Travail réalisé** :
- Correction immédiate du bug trouvé en Phase 0 : `PREFIXES_PROTEGES` dans `proxy.ts` complété avec `/organisation` et `/mes-sessions` (routes ajoutées en D8.1/D8.2 mais jamais enregistrées dans la liste blanche de routes protégées — un visiteur non connecté y déclenchait une `ApiError` 401 brute au lieu d'une redirection propre).
- Tokens couleur : ajout de `--color-info`/`--color-info-soft` (état informatif neutre, distinct de `--color-primary` qui reste réservé à l'appel à l'action) — mappé dans `:root` et `@theme inline` (même convention que les couleurs sémantiques existantes), pour générer les utilitaires `bg-info`/`text-info`/`bg-info-soft`. Nécessaire pour le futur `Badge`/`Alert` de Phase 2 (le prompt maître liste explicitement "info" comme catégorie de couleur requise, et l'audit confirmait qu'elle n'existait nulle part).
- Tokens d'élévation : ajout de `--shadow-elevated` (contenu flottant — Modal, Dropdown, Toast) en complément de `--shadow-soft` existant (désormais réservé aux surfaces au repos — cartes). Appliqué aux 3 surfaces flottantes existantes qui utilisaient jusque-là `--shadow-soft` par défaut : `Modal`, `ProfileMenu` (dropdown admin), `NotificationsBell` (dropdown admin).
- Tokens de rayon : ajout de `--radius-sm` (0.375rem), en préparation des petits composants de Phase 2 (Checkbox, Switch, Tooltip) qui n'ont pas vocation à utiliser `--radius-md`/`--radius-lg`.
- Typographie : hiérarchie formalisée en commentaire de référence dans `globals.css` (couple classe Tailwind ↔ usage sémantique : titre de page, titre de section, corps, texte secondaire, label, caption, donnée chiffrée) — pas de nouvelles classes utilitaires créées, les polices `font-display`/`font-sans` (Plus Jakarta Sans/Inter) déjà en place suffisent déjà à la hiérarchie voulue, seule la convention manquait.
- Dark mode : confirmé **hors scope**, décision déjà explicite et assumée (commentaire existant conservé) — pas de media query ajoutée silencieusement.

**Fichiers modifiés** :
- `apps/web/src/proxy.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/ui/modal.tsx`
- `apps/web/src/components/admin/notifications-bell.tsx`
- `apps/web/src/components/admin/profile-menu.tsx`

**Tests réalisés** : `next build` (production, `NODE_OPTIONS=--max-old-space-size=1536`) — **exit 0**, 44 routes toujours générées à l'identique (dont `/organisation` et `/mes-sessions`, désormais bien listées comme dynamiques/protégées).

**Résultats** : succès, aucune régression de build/typage.

**Problèmes rencontrés** : aucun.

**Critères de sortie** :
- [x] Build web (`next build`) exit 0
- [x] Aucune route existante cassée (44 routes toujours générées)
- [ ] Régression visuelle sur les 3 surfaces flottantes modifiées — non reconfirmée à l'œil (limitation déjà connue de l'outil de navigateur, voir `ROADMAP.md` §10 ; le changement est un simple remplacement de valeur d'ombre CSS, risque visuel jugé minime)

**Statut final : COMPLETED** (2026-09-22).

---

## Phase 2 — Composants fondamentaux

**Statut : COMPLETED** (2026-09-22, build confirmé après redémarrage machine).

**Travail réalisé** (code écrit, pas encore vérifié par un build) :
- `components/ui/badge.tsx` — `Badge` générique (variantes primary/success/warning/danger/info/neutral), remplace le moule dupliqué dans `ei/badges.tsx`, `news/badges.tsx`, `reservations/badges.tsx` (désormais de fins wrappers qui mappent leur enum vers une variante) et le badge inline `StatutAbonnementBadge` de `(app)/tableau-de-bord/page.tsx`.
- `components/ui/card.tsx` — `Card` générique + `StatCard` (extrait de `(admin)/admin/page.tsx`, qui l'importe désormais au lieu de le définir localement).
- `components/comptes/sessions-list.tsx` — unification de `components/admin/sessions-list.tsx` et `components/comptes/mes-sessions-list.tsx` (duplication introduite en D8.2) en un seul composant, branché en interne (`utilisateurId` optionnel) plutôt que par une fonction passée en prop d'un Server Component à un Client Component (ne se sérialise pas). Les deux anciens fichiers supprimés, 3 pages mises à jour (`(admin)/admin/utilisateurs/[id]`, `(app)/mes-sessions`, `(admin)/admin/mes-sessions`).
- `lib/types.ts` — `EtatAction` centralisé (était dupliqué à l'identique dans `admin-actions.ts` et `auth-actions.ts`) ; les deux fichiers le ré-exportent/l'importent désormais depuis `lib/types.ts` au lieu de le redéclarer.
- Nouveaux composants purement additifs (aucun usage existant modifié) : `empty-state.tsx`, `error-state.tsx`, `loading-state.tsx`, `skeleton.tsx`, `tooltip.tsx`, `alert.tsx`, `breadcrumb.tsx`, `tabs.tsx`, `dropdown.tsx`, `confirm-dialog.tsx` (+ variante `danger` ajoutée à `Button`), `toast.tsx` (`ToastProvider`/`useToast`, provider câblé dans `app/layout.tsx`).
- **Volontairement pas fait dans cette phase** : câblage de `ConfirmDialog` sur les boutons destructifs existants (désactivation établissement/utilisateur, révocation de session, retrait de rôle) et de `useToast()` sur les Server Actions existantes — les primitives sont prêtes, le rétrofit sur l'existant est laissé à une phase ultérieure pour ne pas re-tester une dizaine de composants déjà vérifiés dans le même lot que leur création.

**Fichiers modifiés/créés** : voir liste ci-dessus + `components/ui/button.tsx` (variante `danger`) + `app/layout.tsx` (`ToastProvider`).

**Tests réalisés** : `next build` (production, `NODE_OPTIONS=--max-old-space-size=1536`) relancé après redémarrage machine (demandé pour purger les processus zombies suite au kill mémoire précédent) — **exit 0**, compilation 4.9min + TypeScript 106s, **44 routes générées** (même nombre qu'en Phase 1, aucune route perdue), suite complète confirmée sans erreur.

**Problèmes rencontrés** : la première tentative avait été tuée par le mécanisme de protection mémoire de l'environnement (machine à ~4 Go de RAM). Résolu par un redémarrage machine (pratique déjà établie, voir `ROADMAP.md` "Contrainte opérationnelle").

**Critères de sortie** :
- [x] Build web (`next build`) exit 0
- [x] TypeScript sans erreur (106s, aucune erreur)
- [x] Aucune route/fonctionnalité existante cassée — 44 routes générées à l'identique, y compris `/mes-sessions`/`/admin/utilisateurs/[id]` (consommateurs du nouveau `sessions-list.tsx` unifié)

---

## Phase 3 — Architecture de shell commune + conventions Next.js transverses

**Statut : COMPLETED** (2026-09-22).

**Décision de méthode** : les 3 shells (`SiteHeader` marketing, `AppHeader` organisation, `AdminShell` admin) répondent à des besoins réellement différents (nav publique horizontale vs bandeau simple vs sidebar rétractable + notifications + profil) — conformément à `FRONTEND_AUDIT.md` §11 ("unifier... sans casser les redirections/permissions déjà correctes de chacun"), le choix a été de **factoriser les primitives réellement identiques entre eux plutôt que de forcer un composant unique**, ce qui aurait cassé des comportements déjà vérifiés (voir §9 de l'audit, risque de régression explicitement signalé sur le shell admin déjà testé visuellement).

**Travail réalisé** :
- `components/shell/logo.tsx` — wordmark `dps.bj` factorisé (était dupliqué à l'identique 4x : `SiteHeader`, `AppHeader`, `AdminShell` ×2 — desktop + tiroir mobile —, et `(auth)/layout.tsx`), paramétré par `href` (chaque contexte garde sa propre destination : `/`, `/tableau-de-bord`, `/admin`, etc.).
- **Bug corrigé au passage** (`FRONTEND_AUDIT.md` §4.2, "écart UX réel, pas seulement esthétique") : `AppHeader` affichait la nav organisation complète (Auto-évaluation/NEWS/EI/Mon établissement) à un compte individuel, qui n'a accès à aucun de ces modules (RM7, scopés `organisation_id`). Nouveau prop `estIndividuel`, calculé dans `(app)/layout.tsx` **sans appel API supplémentaire** (`!estAdmin && organisation === null` — un compte individuel comme un admin n'a pas d'organisation, mais `estAdmin` est déjà connu séparément) : nav réduite à Formations/Mes réservations/Mes sessions, logo pointant vers `/mes-reservations` plutôt que `/tableau-de-bord`.
- **Conventions Next.js transverses** (`loading.tsx`/`error.tsx`/`not-found.tsx`, absentes de tout `app/**` selon l'audit §4.4) ajoutées **par groupe de routes** : `(marketing)`, `(app)`, `(admin)/admin`, `(auth)` — 12 fichiers + un `not-found.tsx` racine (filet de sécurité hors de tout groupe). `loading.tsx` réutilise `LoadingState` (Phase 2), `error.tsx` réutilise `ErrorState` + bouton "Réessayer" (`reset()`), `not-found.tsx` réutilise `EmptyState` + lien de retour contextuel (accueil pour marketing/auth, tableau de bord pour app, accueil admin pour admin) — aucun nouveau composant créé, uniquement du câblage sur les primitives déjà en place.

**Fichiers créés** :
- `components/shell/logo.tsx`
- `(marketing)/loading.tsx`, `(marketing)/error.tsx`, `(marketing)/not-found.tsx`
- `(app)/loading.tsx`, `(app)/error.tsx`, `(app)/not-found.tsx`
- `(admin)/admin/loading.tsx`, `(admin)/admin/error.tsx`, `(admin)/admin/not-found.tsx`
- `(auth)/loading.tsx`, `(auth)/error.tsx`, `(auth)/not-found.tsx`
- `app/not-found.tsx`

**Fichiers modifiés** : `components/marketing/site-header.tsx`, `components/app-shell/app-header.tsx`, `components/admin/admin-shell.tsx` (+ import `Link` retiré, devenu inutilisé), `app/(auth)/layout.tsx`, `app/(app)/layout.tsx`.

**Tests réalisés** : `tsc --noEmit` (exit 0) puis `next build` (`NODE_OPTIONS=--max-old-space-size=1536`, exit 0, compilation 3.2min + TypeScript 52s) — **44 routes générées, strictement identiques** à la Phase 1/2 (aucune route perdue ni ajoutée dans le routing applicatif — `not-found.tsx` ne crée pas de route, c'est une convention de rendu).

**Problèmes rencontrés** : aucun.

**Volontairement pas fait dans cette phase** (hors du périmètre "shell + conventions transverses", relève de phases dashboard ultérieures) : contenu du dashboard organisation pour un compte individuel (`tableau-de-bord/page.tsx` reste pensé établissement — Phase 6/7 du prompt maître), fusion visuelle des 3 shells en un seul composant, nav-link/mobile-toggle partagés (styles proches mais comportements différents, jugé plus risqué que la valeur apportée à ce stade).

**Critères de sortie** :
- [x] Build web (`next build`) exit 0
- [x] TypeScript sans erreur
- [x] Aucune route existante cassée (44 routes, identique)
- [x] `loading.tsx`/`error.tsx`/`not-found.tsx` présents dans les 4 groupes de routes + racine

---

## Phase 4 — Rétrofit ConfirmDialog + Toast sur les actions existantes

**Statut : COMPLETED** (2026-09-22).

**Périmètre** : reprend exactement ce qui avait été volontairement différé en Phase 2 ("câblage de `ConfirmDialog` sur les boutons destructifs existants... et de `useToast()` sur les Server Actions existantes"). 4 composants concernés, tous identifiés dans `FRONTEND_AUDIT.md` §7 : désactivation établissement, désactivation utilisateur, révocation de session, retrait de rôle.

**Convention appliquée uniformément** : action réversible/non destructive (réactivation, ajout de rôle) → exécution directe + toast succès. Action destructive (désactivation, révocation, retrait) → `ConfirmDialog` obligatoire avant exécution, toast succès à la confirmation, erreur affichée inline sous le bouton (sauf retrait de rôle, voir note) et dialog qui **reste ouvert en cas d'erreur** (le `onConfirm` de `ConfirmDialog` ne ferme la modale que si la promesse ne lève pas — donc chaque câblage relance une `Error` en cas d'`etat.erreur` pour garder ce comportement).

**Travail réalisé** :
- `components/admin/toggle-organisation-button.tsx` / `toggle-utilisateur-button.tsx` — réécrits : `useActionState`/`useFormStatus` remplacés par un état local + appel direct de la Server Action (les actions serveur restent appelables comme de simples fonctions async depuis un client component, pas uniquement via `<form action>`) ; confirmation uniquement sur la désactivation.
- `components/comptes/sessions-list.tsx` (`BoutonRevoquer`) — même conversion, révocation toujours confirmée (toujours destructive, pas de variante non-destructive).
- `components/admin/role-form.tsx` (`RetirerRoleButton`) — même conversion, retrait de rôle toujours confirmé. **Erreur notifiée par toast (danger) plutôt qu'inline** : ce bouton est une simple `×` dans une pastille de rôle compacte, sans place pour un paragraphe d'erreur sous lui sans casser la mise en page — seule exception documentée à la convention inline.
- `components/admin/role-form.tsx` (`RoleForm`, ajout de rôle) — toast succès ajouté (`useEffect` sur `etat.succes`, même pattern déjà utilisé ailleurs dans le projet — `type-ei-form.tsx`, `formation-form.tsx`, etc.) ; action non destructive, pas de `ConfirmDialog`.

**Fichiers modifiés** : `components/admin/toggle-organisation-button.tsx`, `components/admin/toggle-utilisateur-button.tsx`, `components/comptes/sessions-list.tsx`, `components/admin/role-form.tsx`.

**Tests réalisés** : `tsc --noEmit` (exit 0) puis `next build` (exit 0) — **44 routes générées, identiques**, aucune régression de routing/typage.

**Problèmes rencontrés** : aucun.

**Volontairement pas fait** : aucune vérification visuelle en navigateur réel de l'ouverture/fermeture des 4 dialogues (limite déjà connue de l'outil d'automatisation, voir `ROADMAP.md` §10) — comportement vérifié par lecture de code contre l'API de `ConfirmDialog`/`useToast()` déjà éprouvée en Phase 2, pas par capture d'écran.

**Critères de sortie** :
- [x] Build web (`next build`) exit 0
- [x] TypeScript sans erreur
- [x] Aucune route existante cassée (44 routes, identique)
- [x] Les 4 actions destructives identifiées en Phase 0 passent par `ConfirmDialog`
- [x] Accusé de succès visible (`Toast`) sur les 6 actions concernées (désactiver/réactiver établissement, désactiver/réactiver utilisateur, révoquer session, ajouter/retirer rôle)

---

## Phase 5 — Shell premium à sidebar (organisation + admin)

**Statut : COMPLETED (build)** (2026-09-22) — **vérification visuelle en navigateur réel non faite**, voir "Problèmes rencontrés".

**Décision explicite du client (reçue en conversation, pas dans le prompt maître initial)** : niveau de finition visé = dashboards SaaS pro (Linear/Vercel/Stripe), et **les deux** dashboards (organisation + admin) passent par le même schéma : sidebar gauche avec sections repliables, header avec recherche fonctionnelle, avatar/profil, cloche d'alertes en dropdown, responsive. Ceci **révise la décision de méthode de la Phase 3** (qui gardait volontairement l'organisation sur une simple barre horizontale, jugeant les besoins trop différents pour une sidebar commune) — le client a tranché explicitement pour l'unification complète du schéma, donc appliqué tel quel.

**Travail réalisé** :
- `components/shell/sidebar-nav.tsx` — primitive générique de sidebar à sections repliables (état persisté par viewer via `localStorage`, jamais lu/écrit côté serveur ; un groupe contenant la page active reste toujours visible même replié). Utilisée par l'admin ET l'organisation — la vraie "architecture de shell commune" que la Phase 3 avait délibérément limitée au strict minimum (logo).
- `components/shell/quick-search.tsx` — recherche **réellement fonctionnelle** (filtre en direct les pages du shell courant, navigue au clic/Entrée), remplace la barre de recherche purement visuelle identifiée en Phase 0 (`FRONTEND_AUDIT.md` §1). Portée volontairement limitée à la navigation entre pages déjà connues du shell, pas une recherche de données transverses (établissements, utilisateurs par nom...) — cela demanderait un nouvel endpoint API de recherche, hors périmètre d'une passe frontend.
- **Admin** : `admin-sidebar.tsx` restructuré — 14 liens à plat regroupés en 5 sections (Alertes & analyse / Gestion / Opérations / Système + Tableau de bord seul en tête) ; `admin-shell.tsx` branché sur `QuickSearch` à la place de l'encart de recherche factice.
- **Organisation** : nouveau `components/app-shell/org-shell.tsx` (même architecture que `AdminShell`) + `components/app-shell/org-sidebar.tsx` (groupes "Qualité & soins" / "Formations" / "Établissement", réduits à "Formations" seul pour un compte individuel — reprend la distinction `estIndividuel` de la Phase 3) + `components/app-shell/alerts-bell.tsx` (nouveau — équivalent organisation de `NotificationsBell`, mais agrège les **alertes NEWS ouvertes + EI gravité élevée non clôturés**, deux endpoints déjà réels et déjà scopés organisation — `GET /alertes?statut=OUVERTE`, `GET /evenements-indesirables?gravite=ELEVEE` filtré côté serveur sur `statut !== CLOTURE` — **aucun nouvel endpoint API créé**, aucune donnée inventée). Pas de polling contrairement à `NotificationsBell` : la liste reflète l'état courant à chaque navigation, ce n'est pas une file lu/non-lu.
- `components/admin/profile-menu.tsx` généralisé (`sessionsHref` paramétrable, défaut `/mes-sessions`) pour être réutilisé tel quel par les deux shells — admin passe explicitement `/admin/mes-sessions`.
- `(app)/layout.tsx` réécrit : calcule `estIndividuel` (inchangé, Phase 3), récupère `profil` (`/auth/me/profil`, déjà ouvert à tout compte authentifié) et les alertes agrégées, rend `OrgShell`. **Ajout** : un compte `ADMIN_PLATEFORME` qui atterrit sur une route `(app)` (URL tapée à la main — la connexion redirige déjà normalement vers `/admin`) est désormais redirigé vers `/admin` plutôt que de voir un shell organisation dégradé.
- `components/app-shell/app-header.tsx` (l'ancienne barre horizontale) supprimé — plus aucune référence après le branchement de `OrgShell`.

**Fichiers créés** : `components/shell/sidebar-nav.tsx`, `components/shell/quick-search.tsx`, `components/app-shell/org-shell.tsx`, `components/app-shell/org-sidebar.tsx`, `components/app-shell/alerts-bell.tsx`.
**Fichiers modifiés** : `components/admin/admin-sidebar.tsx`, `components/admin/admin-shell.tsx`, `components/admin/profile-menu.tsx`, `app/(app)/layout.tsx`.
**Fichiers supprimés** : `components/app-shell/app-header.tsx`.

**Tests réalisés** : `tsc --noEmit` (exit 0) puis `next build` (exit 0, compilation 74s + TypeScript 37s) — **44 routes générées, identiques**.

**Problèmes rencontrés / limite assumée** : **aucune vérification visuelle en navigateur réel** cette fois — contrairement à la vérification faite en section 10.13 de `ROADMAP.md` pour la première version du shell admin (serveurs lancés en mode production légère, connexion réelle, capture d'écran). Vu l'ampleur du changement (toute la navigation organisation passe d'une barre horizontale à une sidebar) et l'exigence explicite du client sur le niveau de rendu, **cette vérification reste à faire avant de considérer la Phase 5 réellement terminée** — proposé au client comme prochaine étape immédiate plutôt que fait unilatéralement (coût RAM/temps sur cette machine à 4 Go, et identifiants de test à retrouver/réinitialiser).

**Critères de sortie** :
- [x] Build web (`next build`) exit 0
- [x] TypeScript sans erreur
- [x] Aucune route existante cassée (44 routes, identique)
- [x] Sidebar à sections repliables sur les deux shells
- [x] Recherche fonctionnelle (pas juste visuelle) sur les deux shells
- [x] Cloche d'alertes réelle côté organisation (données réelles, pas inventées)
- [ ] **Vérification visuelle réelle en navigateur — non faite, à planifier explicitement**

---

## Phase 5 (retouche 2) — Retours client après vérification visuelle

**Statut : IN_PROGRESS** (2026-09-25) — code fait, typage OK, `next build` à relancer (tué par manque de mémoire), vérification visuelle à faire.

**Demandes explicites du client** (vérification visuelle faite par lui-même) :
1. Footer fixe sur les deux dashboards (admin + organisation).
2. Sidebar : logo seul en haut ; recherche dans le header, à droite de la sidebar ; sidebar et header fixes, seuls les menus de la sidebar défilent.
3. Menu de l'avatar : Profil, Paramètres, Déconnexion, chacun avec son icône.
4. Profil et Déconnexion aussi présents dans les menus de la sidebar.
5. Rendu plus propre, premium, responsive.
6. Retrait des tirets (— / --) dans tous les textes visibles.

**Décisions prises avec le client (question posée le 2026-09-25)** :
- « Paramètres » : admin → `/admin/parametres` ; organisation → `/mes-sessions`, page renommée « Paramètres » (section « Sessions actives »). Aucune nouvelle fonctionnalité créée.
- Retrait également des références techniques visibles (ROADMAP.md, RM7, D8.0, `@dps/shared`...).

**Travail réalisé** :
- `components/shell/app-shell.tsx` (nouveau) : coquille unique admin + organisation (sidebar fixe `w-64` logo seul + menu scrollable `scrollbar-fin`, header fixe translucide, footer fixe `h-11`, tiroir mobile). `AdminShell` et `OrgShell` réduits à de fins wrappers (fin de la duplication).
- `sidebar-nav.tsx` : groupe « Compte » avec bouton Déconnexion (`avecDeconnexion`), indicateur d'élément actif, état replié lu via `useSyncExternalStore` (corrige l'erreur lint `set-state-in-effect` préexistante).
- Groupes « Compte » : admin = Profil, Mes sessions, Déconnexion ; organisation/individuel = Profil, Paramètres, Déconnexion.
- `profile-menu.tsx` : Profil (IconUser), Paramètres (IconSettings, nouvelle), Déconnexion (IconLogout, survol rouge) ; en-tête avec avatar, email et contexte (établissement / administrateur) ; fermeture Échap.
- `quick-search.tsx` : visible aussi sur mobile, raccourci Ctrl/Cmd+K réel.
- Icônes ajoutées : `IconSettings`, `IconDevices`.
- Textes : tous les tirets retirés des textes visibles web (titres, paragraphes, badges, valeurs vides remplacées par des libellés explicites : « Non renseigné », « À planifier », « Aucun établissement »...) + textes API visibles par l'utilisateur (sujets d'emails, erreurs, notifications). Logs/tests/commentaires non concernés.

**Tests réalisés** : `tsc --noEmit` web exit 0 ; ESLint propre sur les fichiers modifiés. `tsc` API : une seule erreur, préexistante et hors périmètre (`test/app.e2e-spec.ts`, `supertest/types` introuvable). 2 erreurs lint préexistantes hors périmètre (`react/no-unescaped-entities` dans `reserver/[formationId]/page.tsx` et `dashboard-charts.tsx`).

**Critères de sortie** :
- [x] Typage web sans erreur (reconfirmé le 2026-09-29, `tsc --noEmit` exit 0, travail vitrine ci-dessous inclus)
- [x] `next build` exit 0 (2026-09-29, serveurs dev/API arrêtés avant, `NODE_OPTIONS=--max-old-space-size=1536` : compilation 2.8min + TypeScript 79s, 48 pages générées). Une tentative du matin même n'avait produit aucun `BUILD_ID` (interrompue).
- [ ] Vérification visuelle réelle (desktop + mobile, admin + organisation) — extension Chrome non connectée le 2026-09-29 ; identifiants du compte organisation de test à fournir.

Vérification du code faite le 2026-09-29 : points 1, 2, 3, 4 et 6 présents dans le code (`shell/app-shell.tsx`, `profile-menu.tsx`, groupes « Compte » de `admin-sidebar.tsx`/`org-sidebar.tsx`, aucun tiret hors commentaires dans `apps/web/src`). Point 5 (rendu premium) : ne peut être jugé que visuellement.

---

## Vitrine marketing + pages légales (2026-09-28 / 29)

**Statut : IN_PROGRESS** — travail trouvé dans le code le 2026-09-29, non journalisé au moment où il a été fait ; cette entrée le consigne a posteriori, strictement d'après les fichiers.

**Travail constaté** :
- `lib/site-config.ts` : informations publiques centralisées (nom, email de contact, réseaux sociaux, date de mise à jour des documents légaux, photos). **À confirmer par le porteur du projet** : `contact@dps.bj` et les URL des réseaux sociaux (déduites du domaine, non fournies explicitement).
- Photos de vitrine (Wikimedia Commons, CC BY-SA, attribution affichée) : `public/images/vitrine/*.jpg` (4), `marketing/hero-visuel.tsx`, `marketing/photo-credit.tsx`, `motion/scroll-zoom-image.tsx`.
- Pages légales : `(marketing)/conditions-utilisation`, `(marketing)/politique-confidentialite`, composant `marketing/legal-page.tsx`.
- `auth/acceptation-cgu.tsx` : case obligatoire (`required`, champ `accepteCgu`) branchée sur les deux formulaires d'inscription.
- `marketing/site-header.tsx`, `marketing/site-footer.tsx`, `marketing/social-icons.tsx`, `(marketing)/page.tsx`, `sitemap.ts`, `globals.css`, `icons.tsx`, `lib/auth-actions.ts` modifiés.

**Tests réalisés** : `tsc --noEmit` exit 0 et `next build` exit 0 (2026-09-29, les deux nouvelles pages légales générées en statique).

**Critères de sortie** :
- [x] Typage + build OK
- [ ] Vérification visuelle
- [ ] Email de contact et URL réseaux sociaux confirmés par le client
