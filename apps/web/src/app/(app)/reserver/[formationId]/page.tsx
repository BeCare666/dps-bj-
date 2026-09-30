import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { Reveal } from "@/components/motion/reveal";
import { ReserverForm } from "@/components/reservations/reserver-form";
import type { Formation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Réserver une formation",
  robots: { index: false, follow: false },
};

export default async function ReserverPage({ params }: { params: Promise<{ formationId: string }> }) {
  const { formationId } = await params;

  let formation: Formation;
  try {
    formation = await apiFetchJson<Formation>(`/formations/${formationId}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:px-8">
      <Reveal>
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Réservation</span>
        <h1 className="mt-2 font-display text-2xl font-bold text-text">{formation.titre}</h1>
        <p className="mt-2 text-text-muted">Choisissez la formule qui vous convient. Le paiement se fait à l'étape suivante.</p>
      </Reveal>

      <Reveal delay={0.05} className="mt-8">
        <ReserverForm formation={formation} />
      </Reveal>
    </div>
  );
}
