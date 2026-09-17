import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { PatientForm } from "@/components/news/patient-form";

export const metadata: Metadata = {
  title: "Nouveau patient — NEWS",
  robots: { index: false, follow: false },
};

export default function NouveauPatientPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:px-8">
      <Reveal>
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Module NEWS</span>
        <h1 className="mt-2 font-display text-2xl font-bold text-text">Nouvelle fiche patient</h1>
        <p className="mt-2 text-text-muted">Les informations de base suffisent pour démarrer le suivi.</p>
      </Reveal>

      <Reveal delay={0.05} className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <PatientForm />
      </Reveal>
    </div>
  );
}
