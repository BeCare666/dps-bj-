import { NextResponse, type NextRequest } from "next/server";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import type { ResultatVerification } from "@/lib/types";

// §10.1 — relais same-origine des suggestions en direct de « Vérifier votre
// établissement » (recherche publique côté API).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);
  try {
    const resultats = await apiFetchJson<ResultatVerification[]>(`/verification/etablissements?q=${encodeURIComponent(q.slice(0, 100))}`);
    return NextResponse.json(resultats);
  } catch (erreur) {
    if (erreur instanceof ApiError) return NextResponse.json([], { status: erreur.status });
    throw erreur;
  }
}
