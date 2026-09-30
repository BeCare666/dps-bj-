import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { UtilisateursTable } from "@/components/admin/utilisateurs-table";
import type { UtilisateurAdmin } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Utilisateurs",
  robots: { index: false, follow: false },
};

async function silencieux<T>(promesse: Promise<T>, repli: T): Promise<T> {
  try {
    return await promesse;
  } catch (erreur) {
    if (erreur instanceof ApiError) return repli;
    throw erreur;
  }
}

export default async function AdminUtilisateursPage() {
  const utilisateurs = await silencieux(apiFetchJson<UtilisateurAdmin[]>("/utilisateurs"), []);

  return (
    <div>
      <p className="mb-6 text-sm text-text-muted">
        {utilisateurs.length} utilisateur{utilisateurs.length > 1 ? "s" : ""} sur la plateforme.
      </p>
      <UtilisateursTable utilisateurs={utilisateurs} />
    </div>
  );
}
