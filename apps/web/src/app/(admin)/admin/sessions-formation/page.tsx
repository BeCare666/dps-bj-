import type { Metadata } from "next";
import { apiFetchJson, silencieux } from "@/lib/api-server";
import { PageHeader } from "@/components/ui/page-header";
import { SessionsFormationAdmin } from "@/components/admin/sessions/sessions-formation-admin";
import type { Formation, SessionFormationAdmin } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Sessions en ligne",
  robots: { index: false, follow: false },
};

export default async function AdminSessionsFormationPage() {
  const [sessions, formations] = await Promise.all([
    silencieux(apiFetchJson<SessionFormationAdmin[]>("/sessions-formation"), []),
    silencieux(apiFetchJson<Formation[]>("/formations"), []),
  ]);
  return (
    <div>
      <PageHeader
        surtitre="Opérations"
        titre="Sessions en ligne"
        description="Planning des sessions Google Meet, feuilles de présence et clôture."
      />
      <SessionsFormationAdmin sessions={sessions} formations={formations} />
    </div>
  );
}
