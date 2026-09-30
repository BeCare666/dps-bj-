import type { Metadata } from "next";
import Link from "next/link";
import { GrilleEditeur } from "@/components/admin/grille-editeur";

export const metadata: Metadata = {
  title: "Administration · Nouvelle grille",
  robots: { index: false, follow: false },
};

export default function NouvelleGrillePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/grilles" className="text-sm font-medium text-text-muted hover:text-text">
        ← Toutes les grilles
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-text">Nouvelle grille d&apos;auto-évaluation</h1>
      <p className="mt-1 text-sm text-text-muted">
        Construisez la structure complète (domaines → normes → critères → éléments mesurables), puis enregistrez.
        La grille sera créée en statut brouillon.
      </p>
      <div className="mt-6">
        <GrilleEditeur />
      </div>
    </div>
  );
}
