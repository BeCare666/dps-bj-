import type { Metadata } from "next";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDateHeure } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { RisqueBadge, StatutAlerteBadge } from "@/components/news/badges";
import type { Alerte } from "@/lib/types";

export const metadata: Metadata = {
  title: "Alertes NEWS",
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

export default async function AlertesPage() {
  const alertes = await silencieux(apiFetchJson<Alerte[]>("/alertes"), []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Reveal>
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Module NEWS</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-text">Alertes cliniques</h1>
        <p className="mt-2 text-text-muted">Déclenchées automatiquement dès qu&apos;un score NEWS dépasse le seuil bas.</p>
      </Reveal>

      <Reveal delay={0.05} className="mt-8 flex flex-col gap-3">
        {alertes.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-5 py-8 text-center text-sm text-text-muted">
            Aucune alerte pour l&apos;instant.
          </p>
        ) : (
          alertes.map((a) => (
            <Link
              key={a.id}
              href={`/news/alertes/${a.id}`}
              className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-colors hover:border-primary/30"
            >
              <div>
                <p className="font-medium text-text">
                  {a.patient ? `${a.patient.prenom} ${a.patient.nom}` : "Patient"}
                </p>
                <p className="text-xs text-text-muted">{formaterDateHeure(a.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <RisqueBadge niveau={a.niveauRisque} />
                <StatutAlerteBadge statut={a.statut} />
              </div>
            </Link>
          ))
        )}
      </Reveal>
    </div>
  );
}
