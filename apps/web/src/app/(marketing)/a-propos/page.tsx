import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "À propos",
  description: "Le Dispositif de Sécurité des Patients (dps.bj) et sa mission auprès des établissements de santé du Bénin.",
};

export default function AProposPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <Reveal>
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">À propos</span>
        <h1 className="mt-3 font-display text-3xl font-bold text-text sm:text-4xl">
          Un dispositif né des besoins du terrain
        </h1>
        <p className="mt-5 text-base leading-7 text-text-muted">
          Le Dispositif de Sécurité des Patients (dps.bj) accompagne les établissements de santé du Bénin,
          hôpitaux (EH) comme établissements de santé primaire communautaire (ESPC), dans une démarche continue
          d&apos;amélioration de la qualité et de la sécurité des soins.
        </p>
        <p className="mt-4 text-base leading-7 text-text-muted">
          La plateforme réunit quatre outils complémentaires : l&apos;auto-évaluation qualité selon des grilles
          adaptées à chaque type d&apos;établissement, la surveillance clinique par score NEWS au chevet du
          patient, la déclaration et le traitement des événements indésirables, et un catalogue de formations
          continues pour les équipes soignantes.
        </p>
        <p className="mt-4 text-base leading-7 text-text-muted">
          Chaque établissement garde la maîtrise de ses propres données : l&apos;isolation entre organisations est
          stricte et systématique, à chaque niveau de la plateforme.
        </p>
      </Reveal>
    </div>
  );
}
