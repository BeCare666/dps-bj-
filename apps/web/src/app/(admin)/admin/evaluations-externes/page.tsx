import type { Metadata } from "next";
import { apiFetchJson, silencieux } from "@/lib/api-server";
import { PageHeader } from "@/components/ui/page-header";
import { EvaluationsExternesAdmin } from "@/components/admin/evaluations-externes-admin";
import type { EvaluationExterne, Organisation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Évaluations ARS / Ministère",
  robots: { index: false, follow: false },
};

export default async function AdminEvaluationsExternesPage() {
  const [evaluations, organisations] = await Promise.all([
    silencieux(apiFetchJson<EvaluationExterne[]>("/evaluations-externes"), []),
    silencieux(apiFetchJson<Organisation[]>("/organisations"), []),
  ]);
  return (
    <div>
      <PageHeader
        surtitre="Opérations"
        titre="Évaluations ARS / Ministère"
        description="Niveaux obtenus lors d'évaluations officielles antérieures à DSP, enregistrés sur justificatif. Ils sont publiés dans « Vérifier votre établissement » ; rattachés automatiquement par IFU à l'inscription."
      />
      <EvaluationsExternesAdmin evaluations={evaluations} organisations={organisations} />
    </div>
  );
}
