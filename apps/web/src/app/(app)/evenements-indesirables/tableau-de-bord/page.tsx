import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apiFetchJson } from "@/lib/api-server";
import { aRole, ROLES_TRAITEMENT_EI } from "@/lib/session";
import { Reveal } from "@/components/motion/reveal";
import type { TableauDeBordEi } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tableau de bord EI",
  robots: { index: false, follow: false },
};

const LIBELLES_STATUT: Record<string, string> = {
  DECLARE: "Déclarés",
  EN_TRAITEMENT: "En traitement",
  CLOTURE: "Clôturés",
};

const LIBELLES_GRAVITE: Record<string, string> = {
  FAIBLE: "Faible",
  MODEREE: "Modérée",
  ELEVEE: "Élevée",
};

export default async function TableauDeBordEiPage() {
  const autorise = await aRole(...ROLES_TRAITEMENT_EI);
  if (!autorise) redirect("/evenements-indesirables");

  const stats = await apiFetchJson<TableauDeBordEi>("/evenements-indesirables/tableau-de-bord");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Reveal className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Module EI</span>
          <h1 className="mt-2 font-display text-3xl font-bold text-text">Tableau de bord</h1>
          <p className="mt-2 text-text-muted">Vue d&apos;ensemble des événements indésirables de l&apos;organisation.</p>
        </div>
        <a
          href="/api/evenements-indesirables/export-csv"
          className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-primary/40 hover:bg-primary-soft/60"
        >
          Exporter en CSV
        </a>
      </Reveal>

      <Reveal delay={0.05} className="mt-8 grid gap-5 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-text-faint">Total</p>
          <p className="mt-2 font-display text-3xl font-bold text-text">{stats.total}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-text-faint">Taux de clôture</p>
          <p className="mt-2 font-display text-3xl font-bold text-text">{stats.tauxCloture}%</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-text-faint">Délai moyen de clôture</p>
          <p className="mt-2 font-display text-3xl font-bold text-text">
            {stats.delaiMoyenClotureJours !== null ? (
              `${stats.delaiMoyenClotureJours} j`
            ) : (
              <span className="text-base font-medium text-text-faint">Aucun EI clôturé</span>
            )}
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Par statut</h2>
        <div className="mt-3 flex flex-col gap-2">
          {Object.entries(stats.parStatut).map(([statut, n]) => (
            <div
              key={statut}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3"
            >
              <span className="text-sm text-text">{LIBELLES_STATUT[statut] ?? statut}</span>
              <span className="font-display text-sm font-bold text-text">{n}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Par gravité</h2>
        <div className="mt-3 flex flex-col gap-2">
          {Object.entries(stats.parGravite).map(([gravite, n]) => (
            <div
              key={gravite}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3"
            >
              <span className="text-sm text-text">{LIBELLES_GRAVITE[gravite] ?? gravite}</span>
              <span className="font-display text-sm font-bold text-text">{n}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
