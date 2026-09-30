import type { Metadata } from "next";
import { apiFetchJson } from "@/lib/api-server";
import { ProfilForm } from "@/components/comptes/profil-form";
import type { UtilisateurProfil } from "@/lib/types";

export const metadata: Metadata = {
  title: "Mon profil",
  robots: { index: false, follow: false },
};

export default async function ProfilPage() {
  const profil = await apiFetchJson<UtilisateurProfil>("/auth/me/profil");

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Profil</span>
      <h1 className="mt-2 font-display text-3xl font-bold text-text">Mon profil</h1>
      <p className="mt-2 text-text-muted">Vos informations personnelles.</p>

      <div className="mt-8">
        <ProfilForm profil={profil} />
      </div>
    </div>
  );
}
