import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { aRole } from "@/lib/session";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { RapportFormulaire } from "@/components/rapports-statistiques/rapport-formulaire";
import { libellePeriodeRapport, titreFormulaire } from "@/lib/rapports-statistiques-libelles";
import type { RapportStatistique } from "@/lib/types";

export const metadata: Metadata = {
  title: "Rapport statistique",
  robots: { index: false, follow: false },
};

export default async function RapportStatistiquePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await aRole("RESPONSABLE_COMPTE"))) redirect("/tableau-de-bord");
  const { id } = await params;

  let rapport: RapportStatistique;
  try {
    rapport = await apiFetchJson<RapportStatistique>(`/rapports-statistiques/${id}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  return (
    <PageContainer>
      <PageHeader
        surtitre="Rapports statistiques"
        titre={titreFormulaire(rapport.formulaireCode)}
        description={libellePeriodeRapport(rapport.formulaireCode, rapport.periode)}
        filAriane={[{ label: "Rapports statistiques", href: "/rapports-statistiques" }, { label: "Rapport" }]}
      />
      <RapportFormulaire key={`${rapport.id}-${rapport.statut}`} rapport={rapport} modifiable={rapport.statut === "BROUILLON"} />
    </PageContainer>
  );
}
