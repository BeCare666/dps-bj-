import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { PageHeader } from "@/components/ui/page-header";
import { RapportFormulaire } from "@/components/rapports-statistiques/rapport-formulaire";
import { ValiderBouton } from "@/components/rapports-statistiques/valider-bouton";
import { libellePeriodeRapport, titreFormulaire } from "@/lib/rapports-statistiques-libelles";
import type { AutoriteSanitaire, RapportStatistique } from "@/lib/types";

export const metadata: Metadata = {
  title: "Rapport reçu",
  robots: { index: false, follow: false },
};

export default async function AutoriteRapportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let rapport: RapportStatistique;
  try {
    rapport = await apiFetchJson<RapportStatistique>(`/autorite/rapports/${id}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }
  const autorite = await apiFetchJson<AutoriteSanitaire>("/autorite/me");
  const peutValider = autorite.niveau === "ZONE_SANITAIRE" && rapport.statut === "SOUMIS";

  return (
    <>
      <PageHeader
        surtitre={rapport.organisation.nom}
        titre={titreFormulaire(rapport.formulaireCode)}
        description={libellePeriodeRapport(rapport.formulaireCode, rapport.periode)}
        filAriane={[{ label: "Rapports reçus", href: "/autorite/rapports" }, { label: rapport.organisation.nom }]}
        actions={peutValider ? <ValiderBouton rapportId={rapport.id} /> : undefined}
      />
      <RapportFormulaire key={`${rapport.id}-${rapport.statut}`} rapport={rapport} modifiable={false} />
    </>
  );
}
