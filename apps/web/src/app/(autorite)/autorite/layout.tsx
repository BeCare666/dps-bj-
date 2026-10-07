import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { aRole } from "@/lib/session";
import { apiFetchJson } from "@/lib/api-server";
import { AutoriteShell } from "@/components/rapports-statistiques/autorite-shell";
import type { AutoriteSanitaire, UtilisateurProfil } from "@/lib/types";

export default async function AutoriteLayout({ children }: { children: ReactNode }) {
  if (!(await aRole("AUTORITE_SANITAIRE"))) redirect("/tableau-de-bord");

  const [autorite, profil] = await Promise.all([
    apiFetchJson<AutoriteSanitaire>("/autorite/me"),
    apiFetchJson<UtilisateurProfil>("/auth/me/profil"),
  ]);

  return (
    <AutoriteShell autorite={autorite.nom} utilisateur={`${profil.prenom} ${profil.nom}`}>
      {children}
    </AutoriteShell>
  );
}
