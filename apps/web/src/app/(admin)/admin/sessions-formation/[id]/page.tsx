import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formaterDateHeure } from "@/lib/format";
import { modifierSessionAction } from "@/lib/sessions-formation-actions";
import { SessionForm } from "@/components/admin/sessions/session-form";
import { FeuillePresence } from "@/components/admin/sessions/feuille-presence";
import { BADGES_STATUT_SESSION } from "@/components/admin/sessions/sessions-formation-admin";
import type { SessionFormationAdmin } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Session en ligne",
  robots: { index: false, follow: false },
};

export default async function AdminSessionFormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session: SessionFormationAdmin;
  try {
    session = await apiFetchJson<SessionFormationAdmin>(`/sessions-formation/${id}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }
  const planifiee = session.statut === "PLANIFIEE";
  const badge = BADGES_STATUT_SESSION[session.statut];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        filAriane={[{ label: "Sessions en ligne", href: "/admin/sessions-formation" }, { label: session.formation.titre }]}
        surtitre="Session en ligne"
        titre={
          <span className="inline-flex flex-wrap items-center gap-3">
            {session.formation.titre}
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </span>
        }
        description={`${formaterDateHeure(session.debut)} → ${formaterDateHeure(session.fin)}`}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader
              titre="Feuille de présence"
              description="Cochez les participants présents, puis clôturez la session : les non-cochés sont enregistrés absents."
            />
            <FeuillePresence session={session} />
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader titre="Session" />
            {planifiee ? (
              <SessionForm action={modifierSessionAction.bind(null, session.id)} session={session} libelleBouton="Enregistrer" />
            ) : (
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-text-faint">Lien Google Meet</dt>
                  <dd className="break-all text-text">{session.lienMeet}</dd>
                </div>
                {session.clotureeLe && (
                  <div>
                    <dt className="text-text-faint">Clôturée le</dt>
                    <dd className="text-text">{formaterDateHeure(session.clotureeLe)}</dd>
                  </div>
                )}
              </dl>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
