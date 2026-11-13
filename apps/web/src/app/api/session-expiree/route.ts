import { NextResponse, type NextRequest } from "next/server";

// Cible de apiFetchJson quand l'API refuse le jeton (401) : efface les cookies
// de session puis renvoie vers /login. Sans cet effacement, proxy.ts verrait
// encore un access_token non expiré et renverrait /login vers /tableau-de-bord
// (boucle).
export function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login?expiree=1", request.url));
  res.cookies.delete("access_token");
  res.cookies.delete("refresh_token");
  return res;
}
