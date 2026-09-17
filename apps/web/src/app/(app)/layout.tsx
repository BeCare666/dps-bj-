import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-shell/app-header";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import type { Organisation } from "@/lib/types";

async function obtenirOrganisation(): Promise<Organisation | null> {
  try {
    return await apiFetchJson<Organisation>("/organisations/me");
  } catch (erreur) {
    if (erreur instanceof ApiError) return null;
    throw erreur;
  }
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const organisation = await obtenirOrganisation();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-bg-subtle">
      <AppHeader organisationNom={organisation?.nom} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
