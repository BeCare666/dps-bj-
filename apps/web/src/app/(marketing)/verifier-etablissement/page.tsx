import type { Metadata } from "next";
import { Suspense } from "react";
import { RechercheEtablissement } from "@/components/verification/recherche-etablissement";

export const metadata: Metadata = {
  title: "Vérifier votre établissement",
  description:
    "Consultez le niveau de sécurité des patients d'un établissement de santé sur l'échelle ARS (0 à 5) : auto-évaluation sur DSP ou évaluation officielle ARS / Ministère.",
};

export default function VerifierEtablissementPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col px-5 py-16 sm:px-8 sm:py-24">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">Vérifier votre établissement</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-text-muted">
          Rechercher un établissement de santé pour connaître son niveau de conformité au dispositif de la sécurité
          des patients
        </p>
      </div>
      <Suspense>
        <RechercheEtablissement />
      </Suspense>
    </div>
  );
}
