import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { GrilleEditeur } from "@/components/admin/grille-editeur";
import { GrilleViewer } from "@/components/admin/grille-viewer";
import type { Grille } from "@/lib/types";

const LIBELLES_STATUT: Record<Grille["statut"], string> = {
  BROUILLON: "Brouillon",
  PUBLIEE: "Publiée",
  ARCHIVEE: "Archivée",
};

export default async function GrilleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let grille: Grille;
  try {
    grille = await apiFetchJson<Grille>(`/grilles/${id}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/grilles" className="text-sm font-medium text-text-muted hover:text-text">
        ← Toutes les grilles
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">{grille.nom}</h1>
          <p className="mt-1 text-sm text-text-muted">Version {grille.version}</p>
        </div>
        <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-xs font-semibold text-text-faint">
          {LIBELLES_STATUT[grille.statut]}
        </span>
      </div>

      <div className="mt-6">
        {grille.statut === "BROUILLON" ? (
          <GrilleEditeur grille={grille} grilleId={grille.id} />
        ) : (
          <GrilleViewer grille={grille} />
        )}
      </div>
    </div>
  );
}
