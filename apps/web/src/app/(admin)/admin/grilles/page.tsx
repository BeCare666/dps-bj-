import type { Metadata } from "next";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { GrillesTable } from "@/components/admin/grilles-table";
import type { Grille } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Grilles d'auto-évaluation",
  robots: { index: false, follow: false },
};

async function silencieux<T>(promesse: Promise<T>, repli: T): Promise<T> {
  try {
    return await promesse;
  } catch (erreur) {
    if (erreur instanceof ApiError) return repli;
    throw erreur;
  }
}

export default async function AdminGrillesPage() {
  const grilles = await silencieux(apiFetchJson<Grille[]>("/grilles"), []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          {grilles.length} grille{grilles.length > 1 ? "s" : ""} d&apos;auto-évaluation (tous statuts).
        </p>
        <Link
          href="/admin/grilles/nouveau"
          className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          + Nouvelle grille
        </Link>
      </div>
      <GrillesTable grilles={grilles} />
    </div>
  );
}
