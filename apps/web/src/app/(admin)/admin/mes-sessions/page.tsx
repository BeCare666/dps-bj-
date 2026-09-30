import type { Metadata } from "next";
import { apiFetchJson } from "@/lib/api-server";
import { SessionsList } from "@/components/comptes/sessions-list";
import type { SessionUtilisateur } from "@/lib/types";

export const metadata: Metadata = {
  title: "Mes sessions",
  robots: { index: false, follow: false },
};

// Atteinte depuis le groupe « Compte » de la sidebar admin.
export default async function AdminMesSessionsPage() {
  const sessions = await apiFetchJson<SessionUtilisateur[]>("/auth/me/sessions");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-text">Mes sessions</h1>
      <p className="mt-2 text-sm text-text-muted">
        Appareils et navigateurs actuellement connectés à votre compte administrateur.
      </p>

      <div className="mt-6">
        <SessionsList sessions={sessions} />
      </div>
    </div>
  );
}
