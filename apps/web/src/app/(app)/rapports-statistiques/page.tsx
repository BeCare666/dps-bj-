import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apiFetchJson, silencieux } from "@/lib/api-server";
import { aRole } from "@/lib/session";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBarChart } from "@/components/icons";
import { NouveauRapportForm } from "@/components/rapports-statistiques/nouveau-rapport-form";
import { RapportsTable } from "@/components/rapports-statistiques/rapports-table";
import type { RapportStatistiqueResume } from "@/lib/types";

export const metadata: Metadata = {
  title: "Rapports statistiques",
  robots: { index: false, follow: false },
};

// Décision client : seul le responsable du compte remplit et soumet les rapports.
export default async function RapportsStatistiquesPage() {
  if (!(await aRole("RESPONSABLE_COMPTE"))) redirect("/tableau-de-bord");

  const rapports = await silencieux(apiFetchJson<RapportStatistiqueResume[]>("/rapports-statistiques"), []);

  return (
    <PageContainer>
      <PageHeader
        surtitre="Établissement"
        titre="Rapports statistiques"
        description="Relevés et rapports du ministère de la Santé, remplis en ligne puis transmis à la zone sanitaire, à la direction départementale et au ministère."
      />
      <div className="flex flex-col gap-6">
        <NouveauRapportForm />
        {rapports.length === 0 ? (
          <EmptyState
            icon={<IconBarChart className="h-8 w-8" />}
            titre="Aucun rapport pour le moment"
            description="Choisissez un formulaire et une période ci-dessus pour commencer. Le rapport reste un brouillon tant que vous ne l'avez pas soumis."
          />
        ) : (
          <RapportsTable rapports={rapports} lienBase="/rapports-statistiques" />
        )}
      </div>
    </PageContainer>
  );
}
