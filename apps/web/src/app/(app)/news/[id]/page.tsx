import { notFound } from "next/navigation";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDateHeure } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { RisqueBadge, StatutPatientBadge } from "@/components/news/badges";
import { MesureForm } from "@/components/news/mesure-form";
import { CloturerPatientButton } from "@/components/news/cloturer-patient-button";
import type { MesureNews, Patient } from "@/lib/types";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let patient: Patient;
  let mesures: MesureNews[];
  try {
    [patient, mesures] = await Promise.all([
      apiFetchJson<Patient>(`/patients/${id}`),
      apiFetchJson<MesureNews[]>(`/patients/${id}/mesures`),
    ]);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  const historique = [...mesures].reverse();
  const derniere = historique[0];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Reveal className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Fiche patient</span>
          <h1 className="mt-2 font-display text-3xl font-bold text-text">
            {patient.prenom} {patient.nom}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <StatutPatientBadge statut={patient.statut} />
            {derniere && <RisqueBadge niveau={derniere.niveauRisque} />}
          </div>
        </div>
        {patient.statut === "HOSPITALISE" && <CloturerPatientButton patientId={patient.id} />}
      </Reveal>

      {patient.statut === "HOSPITALISE" && (
        <Reveal delay={0.05} className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-text-faint">Nouvelle mesure</h2>
          <MesureForm patientId={patient.id} />
        </Reveal>
      )}

      <Reveal delay={0.1} className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          Historique des mesures ({historique.length})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {historique.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-5 py-8 text-center text-sm text-text-muted">
              Aucune mesure enregistrée pour l&apos;instant.
            </p>
          ) : (
            historique.map((m) => (
              <div key={m.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text">{formaterDateHeure(m.dateMesure)}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-text">{m.scoreTotal}</span>
                    <RisqueBadge niveau={m.niveauRisque} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-text-muted sm:grid-cols-3">
                  <span>FR : {m.frequenceRespiratoire}/min</span>
                  <span>SpO2 : {m.saturationOxygene}%</span>
                  <span>Temp. : {m.temperature}°C</span>
                  <span>PA syst. : {m.pressionArterielleSystolique} mmHg</span>
                  <span>FC : {m.frequenceCardiaque}/min</span>
                  <span>{m.oxygenoSupplementation ? "Sous O2" : "Air ambiant"}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Reveal>
    </div>
  );
}
