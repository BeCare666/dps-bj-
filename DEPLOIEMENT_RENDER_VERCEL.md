# Déploiement DSP — Render (API) et Vercel (web)

Les deux services se déploient depuis **le même dépôt** : `BeCare666/dps-bj-`, branche `main` (commit `2eb1f90`).

Pourquoi ? L'API et le web utilisent le paquet interne `@dps/shared` (dossier `packages/shared`). Ce paquet n'existe que dans ce monorepo. C'est son absence qui provoquait l'erreur `404 @dps/shared` sur Render et sur Vercel avec les anciens dépôts `dspapi-` et `dsp-`.

---

## ⚠️ Pourquoi `--include=dev`

Les outils de compilation (`typescript`, `@nestjs/cli`, `prisma`, `tailwindcss`) sont des dépendances de développement. Quand `NODE_ENV=production` est défini, un simple `npm ci` ne les installe pas et le build échoue avec « command not found ». `--include=dev` les installe quand même : ils servent au build, puis l'application tourne normalement en production.

---

## 1. Render — API

Dans **Settings** du service Render, connecter le dépôt :

```
BeCare666/dps-bj-
```

Branche :

```
main
```

**Root Directory** : laisser **vide**.

**Build Command** :

```
npm ci --include=dev && npm run build -w @dps/shared && cd apps/api && npx prisma generate && npm run build
```

**Start Command** :

```
cd apps/api && node dist/main
```

### Variables d'environnement Render

Copier les **valeurs** depuis ton fichier `apps/api/.env`. Ne pas ajouter `PORT` : Render le fournit lui-même.

Noms des variables à créer :

```
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_TTL
JWT_REFRESH_TTL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
BREVO_API_KEY
BREVO_SENDER_EMAIL
BREVO_SENDER_NAME
KKIAPAY_PUBLIC_KEY
KKIAPAY_PRIVATE_KEY
KKIAPAY_SECRET
KKIAPAY_SANDBOX
NODE_ENV
WEB_APP_URL
API_URL
```

Valeurs particulières :

- `NODE_ENV` :

```
production
```

- `WEB_APP_URL` : l'URL de ton site Vercel, sans `/` final (exemple : `https://dsp-xxxx.vercel.app`).
- `API_URL` : l'URL de ton service Render, sans `/` final (exemple : `https://dps-api-xxxx.onrender.com`).

---

## 2. Vercel — web

Dans **Settings** du projet Vercel, connecter le dépôt :

```
BeCare666/dps-bj-
```

**Framework Preset** : Next.js

**Root Directory** :

```
apps/web
```

**Install Command** (activer « Override ») — ⚠️ c'est bien `npm ci`, PAS la commande de build :

```
cd ../.. && npm ci --include=dev
```

**Build Command** (activer « Override ») — à mettre dans le champ **Build Command**, pas dans Install Command :

```
cd ../.. && npm run build -w @dps/shared && npm run build -w web
```

**Output Directory** : laisser la valeur par défaut.

Dans **Settings → General → Root Directory**, l'option **« Include files outside the Root Directory in the Build Step »** doit rester **activée**.

### Variables d'environnement Vercel

Copier les **valeurs** depuis ton fichier `apps/web/.env.local`, sauf pour `API_URL` (voir plus bas).

```
API_URL
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY
NEXT_PUBLIC_KKIAPAY_SANDBOX
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

- `API_URL` et `NEXT_PUBLIC_API_URL` : l'URL de ton service Render, sans `/` final.

---

## 3. Ordre conseillé

1. Déployer **Render** en premier, puis noter son URL.
2. Mettre cette URL dans `API_URL` et `NEXT_PUBLIC_API_URL` sur Vercel, puis déployer **Vercel**.
3. Revenir sur Render, mettre l'URL Vercel dans `WEB_APP_URL`, puis redéployer Render (« Manual Deploy »).

---

## 4. Base de données

Les migrations sont déjà appliquées sur la base `dps_bj`. Il n'y a rien à faire si `DATABASE_URL` pointe vers cette base.

**Seulement si** tu utilises une **autre** base, lancer une fois cette commande depuis ton PC, dans le dossier du projet :

```
cd apps/api && npx prisma migrate deploy
```

---

## 5. Si le build Vercel échoue avec une erreur « Turbopack »

Remplacer la **Build Command** Vercel par :

```
cd ../.. && npm run build -w @dps/shared && cd apps/web && npx next build --webpack
```

---

## 6. Si un déploiement échoue encore

Copier le log complet de l'erreur dans un fichier `.md` à la racine du projet et me le donner.
