import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDateHeure } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import type { ResultatScore, SessionEvaluation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Résultats de l'auto-évaluation",
  robots: { index: false, follow: false },
};

export default async function ResultatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let session: SessionEvaluation;
  let resultats: ResultatScore;
  try {
    [session, resultats] = await Promise.all([
      apiFetchJson<SessionEvaluation>(`/sessions-evaluation/${id}`),
      apiFetchJson<ResultatScore>(`/sessions-evaluation/${id}/resultats`),
    ]);
  } catch (erreur) {
    if (erreur instanceof ApiError && (erreur.status === 404 || erreur.status === 409)) {
      redirect("/auto-evaluation");
    }
    throw erreur;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <Reveal>
        <Link href="/auto-evaluation" className="text-sm font-medium text-primary hover:underline">
          ← Retour à l&apos;auto-évaluation
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold text-text">{session.grille.nom}</h1>
        {session.dateSoumission && (
          <p className="mt-1 text-sm text-text-muted">Soumise le {formaterDateHeure(session.dateSoumission)}</p>
        )}
      </Reveal>

      <Reveal delay={0.05} className="mt-6">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
          <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Score global</span>
          <p className="mt-2 font-display text-6xl font-bold text-primary">{resultats.scoreGlobal}%</p>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Score par domaine</h2>
        <div className="mt-3 flex flex-col gap-4">
          {resultats.parDomaine.map((domaine) => (
            <div key={domaine.domaineId}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-text">{domaine.nom}</span>
                <span className="text-text-muted">
                  {domaine.criteresValides} / {domaine.criteresTotal} critères
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary" style={{ width: `${domaine.scorePct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {resultats.criteresNonValides.length > 0 && (
        <Reveal delay={0.15} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
            Écarts à corriger ({resultats.criteresNonValides.length})
          </h2>
          <div className="mt-3 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
            {resultats.criteresNonValides.map((critere, i) => (
              <div
                key={critere.critereId}
                className={`px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-text-faint">{critere.domaineNom}</p>
                <p className="mt-1 text-sm text-text">
                  <span className="font-medium">{critere.code}</span> · {critere.libelle}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
