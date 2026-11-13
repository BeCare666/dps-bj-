import { NextResponse, type NextRequest } from "next/server";

// Garde des routes + rafraîchissement silencieux de la session.
//
// Le jeton d'accès (access_token) vit 15 min, le refresh_token 30 jours
// (apps/api/.env : JWT_ACCESS_TTL / JWT_REFRESH_TTL). Avant ce correctif, rien
// n'appelait /auth/refresh : un utilisateur actif était déconnecté toutes les
// 15 min, et une page rendue juste après l'expiration du jeton (cookie encore
// présent, jeton déjà refusé par l'API) tombait en erreur 500.
//
// Désormais, à chaque requête : si le jeton d'accès est absent ou expire dans
// moins de MARGE_SECONDES, on le renouvelle auprès de l'API avec le
// refresh_token, on pose les nouveaux cookies sur la réponse ET sur la requête
// en cours (les Server Components de cette même requête voient donc le jeton
// neuf). Si le renouvellement échoue (session révoquée, expirée), les cookies
// sont effacés et l'utilisateur est redirigé vers /login.
//
// Le décodage du JWT ne vérifie pas la signature : il sert seulement à lire
// `exp`. L'autorisation reste appliquée par l'API.

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const MARGE_SECONDES = 60;
// Alignées sur apps/web/src/lib/session-cookies.ts.
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

const PREFIXES_PROTEGES = [
  "/tableau-de-bord",
  "/auto-evaluation",
  "/news",
  "/evenements-indesirables",
  "/reserver",
  "/mes-reservations",
  "/organisation",
  "/mes-sessions",
  "/profil",
  "/admin",
  "/rapports-statistiques",
  "/autorite",
];
const ROUTES_AUTH = ["/login", "/inscription"];

function expirationJwt(token: string): number | null {
  const partie = token.split(".")[1];
  if (!partie) return null;
  try {
    const json = atob(partie.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

function jetonEncoreValable(token: string | undefined): boolean {
  if (!token) return false;
  const exp = expirationJwt(token);
  return exp !== null && exp * 1000 > Date.now() + MARGE_SECONDES * 1000;
}

function valeurSetCookie(setCookies: string[], nom: string): string | undefined {
  const ligne = setCookies.find((c) => c.startsWith(`${nom}=`));
  return ligne ? ligne.split(";")[0]!.slice(nom.length + 1) : undefined;
}

type Jetons = { accessToken: string; refreshToken: string };

// Plusieurs requêtes parallèles (préchargements de liens, appels /api/*)
// arrivent souvent avec le même refresh_token : on ne fait qu'un appel à l'API
// par refresh_token et par instance. L'API tolère en plus une courte fenêtre de
// réutilisation (voir AuthService.refresh) pour les instances distinctes.
const renouvellementsEnCours = new Map<string, Promise<Jetons | null>>();

async function appelerRefresh(refreshToken: string): Promise<Jetons | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refresh_token=${refreshToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const setCookies = res.headers.getSetCookie();
    const accessToken = valeurSetCookie(setCookies, "access_token");
    const nouveauRefresh = valeurSetCookie(setCookies, "refresh_token");
    return accessToken && nouveauRefresh ? { accessToken, refreshToken: nouveauRefresh } : null;
  } catch {
    // API injoignable : on ne déconnecte pas sur une panne réseau passagère.
    return null;
  }
}

function renouveler(refreshToken: string): Promise<Jetons | null> {
  const enCours = renouvellementsEnCours.get(refreshToken);
  if (enCours) return enCours;
  const promesse = appelerRefresh(refreshToken);
  renouvellementsEnCours.set(refreshToken, promesse);
  // Garde le résultat quelques secondes pour les requêtes arrivées juste après.
  void promesse.finally(() => setTimeout(() => renouvellementsEnCours.delete(refreshToken), 10_000));
  return promesse;
}

const optionsCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function appliquerCookies(res: NextResponse, jetons: Jetons | null, effacer: boolean): NextResponse {
  if (jetons) {
    res.cookies.set("access_token", jetons.accessToken, { ...optionsCookie, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.cookies.set("refresh_token", jetons.refreshToken, { ...optionsCookie, maxAge: REFRESH_TOKEN_MAX_AGE });
  } else if (effacer) {
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
  }
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let estConnecte = jetonEncoreValable(accessToken);
  let jetons: Jetons | null = null;
  let effacer = false;

  if (!estConnecte && refreshToken) {
    jetons = await renouveler(refreshToken);
    if (jetons) {
      estConnecte = true;
      // La requête en cours (Server Components, Server Actions, /api/*) lit
      // ses cookies ici : on lui passe directement les jetons neufs.
      request.cookies.set("access_token", jetons.accessToken);
      request.cookies.set("refresh_token", jetons.refreshToken);
    } else {
      effacer = true;
    }
  } else if (!estConnecte && accessToken) {
    // Jeton d'accès périmé sans refresh_token : cookie inutile, on l'efface.
    effacer = true;
  }

  if (effacer) {
    request.cookies.delete("access_token");
    request.cookies.delete("refresh_token");
  }

  const estProtegee = PREFIXES_PROTEGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (estProtegee && !estConnecte) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return appliquerCookies(NextResponse.redirect(url), null, effacer);
  }

  const estRouteAuth = ROUTES_AUTH.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (estRouteAuth && estConnecte) {
    return appliquerCookies(NextResponse.redirect(new URL("/tableau-de-bord", request.url)), jetons, effacer);
  }

  return appliquerCookies(NextResponse.next({ request: { headers: request.headers } }), jetons, effacer);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)"],
};
