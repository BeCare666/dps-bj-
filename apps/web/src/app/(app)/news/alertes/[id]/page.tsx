import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDateHeure } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { RisqueBadge, StatutAlerteBadge } from "@/components/news/badges";
import { InterventionForm } from "@/components/news/intervention-form";
import { StatutAlerteButtons } from "@/components/news/statut-alerte-buttons";
import type { Alerte } from "@/lib/types";

export default async function AlerteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let alerte: Alerte;
  try {
    alerte = await apiFetchJson<Alerte>(`/alertes/${id}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <Reveal>
        <Link href="/news/alertes" className="text-sm font-medium text-text-muted hover:text-text">
          ← Toutes les alertes
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-text">
              {alerte.patient ? (
                <Link href={`/news/${alerte.patient.id}`} className="hover:underline">
                  {alerte.patient.prenom} {alerte.patient.nom}
                </Link>
              ) : (
                "Alerte"
              )}
            </h1>
            <p className="mt-1 text-sm text-text-muted">Déclenchée le {formaterDateHeure(alerte.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <RisqueBadge niveau={alerte.niveauRisque} />
            <StatutAlerteBadge statut={alerte.statut} />
          </div>
        </div>
      </Reveal>

      {alerte.mesure && (
        <Reveal delay={0.05} className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Mesure déclencheuse</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-text">{alerte.mesure.scoreTotal}</span>
            <span className="text-sm text-text-muted">score NEWS</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-text-muted sm:grid-cols-3">
            <span>FR : {alerte.mesure.frequenceRespiratoire}/min</span>
            <span>SpO2 : {alerte.mesure.saturationOxygene}%</span>
            <span>Temp. : {alerte.mesure.temperature}°C</span>
            <span>PA syst. : {alerte.mesure.pressionArterielleSystolique} mmHg</span>
            <span>FC : {alerte.mesure.frequenceCardiaque}/min</span>
            <span>{alerte.mesure.oxygenoSupplementation ? "Sous O2" : "Air ambiant"}</span>
          </div>
        </Reveal>
      )}

      {alerte.statut !== "CLOTUREE" && (
        <Reveal delay={0.1} className="mt-6">
          <StatutAlerteButtons alerteId={alerte.id} statutActuel={alerte.statut} />
        </Reveal>
      )}

      <Reveal delay={0.15} className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          Interventions ({alerte.interventions?.length ?? 0})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {alerte.interventions?.map((i) => (
            <div key={i.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <p className="text-sm text-text">{i.note}</p>
              <p className="mt-1.5 text-xs text-text-faint">{formaterDateHeure(i.createdAt)}</p>
            </div>
          ))}
        </div>

        {alerte.statut !== "CLOTUREE" && (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <InterventionForm alerteId={alerte.id} />
          </div>
        )}
      </Reveal>
    </div>
  );
}
