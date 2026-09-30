import type { Metadata } from "next";
import { apiFetchJson } from "@/lib/api-server";
import { SessionsList } from "@/components/comptes/sessions-list";
import type { SessionUtilisateur } from "@/lib/types";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false },
};

export default async function MesSessionsPage() {
  const sessions = await apiFetchJson<SessionUtilisateur[]>("/auth/me/sessions");

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Compte</span>
      <h1 className="mt-2 font-display text-3xl font-bold text-text">Paramètres</h1>
      <p className="mt-2 text-text-muted">Sécurité et accès à votre compte.</p>

      <h2 className="mt-10 font-display text-lg font-semibold text-text">Sessions actives</h2>
      <p className="mt-1 text-sm text-text-muted">
        Appareils et navigateurs actuellement connectés à votre compte. Révoquez toute session que vous ne reconnaissez pas.
      </p>

      <div className="mt-5">
        <SessionsList sessions={sessions} />
      </div>
    </div>
  );
}
