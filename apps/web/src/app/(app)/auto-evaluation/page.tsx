import type { Metadata } from "next";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDate } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { DemarrerSessionButton } from "@/components/auto-evaluation/demarrer-session-button";
import type { Grille, Organisation, SessionEvaluationResume } from "@/lib/types";

export const metadata: Metadata = {
  title: "Auto-évaluation",
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

export default async function AutoEvaluationPage() {
  const organisation = await silencieux(apiFetchJson<Organisation | null>("/organisations/me"), null);
  const [grilles, sessions] = await Promise.all([
    silencieux(apiFetchJson<Grille[]>(`/grilles${organisation ? `?type=${organisation.type}` : ""}`), []),
    silencieux(apiFetchJson<SessionEvaluationResume[]>("/sessions-evaluation"), []),
  ]);

  const enCours = sessions.filter((s) => s.statut === "EN_COURS");
  const soumises = sessions.filter((s) => s.statut === "SOUMISE");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Reveal>
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Module gratuit</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-text">Auto-évaluation</h1>
        <p className="mt-2 text-text-muted">
          Grille{organisation ? ` ${organisation.type}` : ""} — répondez critère par critère, le score est calculé
          automatiquement à la soumission.
        </p>
      </Reveal>

      {enCours.length > 0 && (
        <Reveal delay={0.05} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Sessions en cours</h2>
          <div className="mt-3 flex flex-col gap-3">
            {enCours.map((s) => (
              <Link
                key={s.id}
                href={`/auto-evaluation/${s.id}`}
                className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-colors hover:border-primary/30"
              >
                <div>
                  <p className="font-medium text-text">{s.grille.nom}</p>
                  <p className="text-xs text-text-muted">Démarrée le {formaterDate(s.dateDebut)}</p>
                </div>
                <span className="text-sm font-medium text-primary">Continuer →</span>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal delay={0.1} className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Démarrer une évaluation</h2>
        <div className="mt-3 flex flex-col gap-3">
          {grilles.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-5 py-8 text-center text-sm text-text-muted">
              Aucune grille disponible pour votre type d&apos;établissement pour le moment.
            </p>
          ) : (
            grilles.map((grille) => (
              <div
                key={grille.id}
                className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5"
              >
                <div>
                  <p className="font-medium text-text">{grille.nom}</p>
                  <p className="text-xs text-text-muted">Version {grille.version}</p>
                </div>
                <DemarrerSessionButton grilleId={grille.id} />
              </div>
            ))
          )}
        </div>
      </Reveal>

      {soumises.length > 0 && (
        <Reveal delay={0.15} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Historique</h2>
          <div className="mt-3 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
            {soumises.map((s, i) => (
              <Link
                key={s.id}
                href={`/auto-evaluation/${s.id}/resultats`}
                className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-bg-subtle ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div>
                  <p className="font-medium text-text">{s.grille.nom}</p>
                  <p className="text-xs text-text-muted">
                    Soumise le {s.dateSoumission ? formaterDate(s.dateSoumission) : "—"}
                  </p>
                </div>
                <span className="font-display text-lg font-bold text-primary">{s.scoreGlobal}%</span>
              </Link>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
