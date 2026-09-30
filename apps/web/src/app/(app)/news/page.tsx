import type { Metadata } from "next";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDate } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { StatutPatientBadge } from "@/components/news/badges";
import type { Alerte, Patient } from "@/lib/types";

export const metadata: Metadata = {
  title: "NEWS · Surveillance clinique",
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

export default async function NewsPage() {
  const [patients, alertesOuvertes] = await Promise.all([
    silencieux(apiFetchJson<Patient[]>("/patients"), []),
    silencieux(apiFetchJson<Alerte[]>("/alertes?statut=OUVERTE"), []),
  ]);

  const hospitalises = patients.filter((p) => p.statut === "HOSPITALISE");
  const sortis = patients.filter((p) => p.statut === "SORTI");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Reveal className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Module NEWS</span>
          <h1 className="mt-2 font-display text-3xl font-bold text-text">Surveillance clinique</h1>
          <p className="mt-2 text-text-muted">Score NEWS2 calculé automatiquement à chaque mesure.</p>
        </div>
        <Button href="/news/nouveau">+ Nouveau patient</Button>
      </Reveal>

      {alertesOuvertes.length > 0 && (
        <Reveal delay={0.05} className="mt-8">
          <Link
            href="/news/alertes"
            className="flex items-center justify-between rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft px-5 py-4 transition-colors hover:border-danger/50"
          >
            <p className="text-sm font-medium text-danger">
              {alertesOuvertes.length} alerte{alertesOuvertes.length > 1 ? "s" : ""} ouverte
              {alertesOuvertes.length > 1 ? "s" : ""} nécessite{alertesOuvertes.length > 1 ? "nt" : ""} une prise en
              charge
            </p>
            <span className="text-sm font-medium text-danger">Voir →</span>
          </Link>
        </Reveal>
      )}

      <Reveal delay={0.1} className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          Patients hospitalisés ({hospitalises.length})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {hospitalises.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-5 py-8 text-center text-sm text-text-muted">
              Aucun patient hospitalisé pour l&apos;instant.
            </p>
          ) : (
            hospitalises.map((p) => (
              <Link
                key={p.id}
                href={`/news/${p.id}`}
                className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-colors hover:border-primary/30"
              >
                <div>
                  <p className="font-medium text-text">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="text-xs text-text-muted">Admis le {formaterDate(p.dateAdmission)}</p>
                </div>
                <StatutPatientBadge statut={p.statut} />
              </Link>
            ))
          )}
        </div>
      </Reveal>

      {sortis.length > 0 && (
        <Reveal delay={0.15} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
            Historique ({sortis.length})
          </h2>
          <div className="mt-3 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
            {sortis.map((p, i) => (
              <Link
                key={p.id}
                href={`/news/${p.id}`}
                className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-bg-subtle ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div>
                  <p className="font-medium text-text">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="text-xs text-text-muted">{p.dateSortie ? `Sorti le ${formaterDate(p.dateSortie)}` : "Date de sortie non renseignée"}</p>
                </div>
                <StatutPatientBadge statut={p.statut} />
              </Link>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
