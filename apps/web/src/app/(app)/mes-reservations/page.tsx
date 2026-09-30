import type { Metadata } from "next";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDate, formaterFcfa } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { StatutReservationBadge } from "@/components/reservations/badges";
import type { Reservation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Mes réservations",
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

export default async function MesReservationsPage() {
  const reservations = await silencieux(apiFetchJson<Reservation[]>("/reservations"), []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <Reveal className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Formations</span>
          <h1 className="mt-2 font-display text-3xl font-bold text-text">Mes réservations</h1>
        </div>
        <Button variant="secondary" href="/formations">
          Voir le catalogue
        </Button>
      </Reveal>

      <Reveal delay={0.05} className="mt-8 flex flex-col gap-3">
        {reservations.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-5 py-8 text-center text-sm text-text-muted">
            Aucune réservation pour l&apos;instant.
          </p>
        ) : (
          reservations.map((r) => (
            <Link
              key={r.id}
              href={`/mes-reservations/${r.id}`}
              className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-colors hover:border-primary/30"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-text">{r.formation?.titre ?? "Formation"}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Réservée le {formaterDate(r.createdAt)} · {formaterFcfa(r.tarifApplique)}
                </p>
              </div>
              <StatutReservationBadge statut={r.statut} />
            </Link>
          ))
        )}
      </Reveal>
    </div>
  );
}
