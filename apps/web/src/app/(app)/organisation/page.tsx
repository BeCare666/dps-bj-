import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apiFetchJson } from "@/lib/api-server";
import { aRole } from "@/lib/session";
import { OrganisationForm } from "@/components/organisation/organisation-form";
import type { Organisation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Mon établissement",
  robots: { index: false, follow: false },
};

export default async function MonOrganisationPage() {
  const autorise = await aRole("RESPONSABLE_COMPTE");
  if (!autorise) redirect("/tableau-de-bord");

  const organisation = await apiFetchJson<Organisation>("/organisations/me");

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Établissement</span>
      <h1 className="mt-2 font-display text-3xl font-bold text-text">Mon établissement</h1>
      <p className="mt-2 text-text-muted">
        Coordonnées de votre établissement. Le type d&apos;établissement et l&apos;IFU ne sont pas modifiables ici.
      </p>

      <div className="mt-8">
        <OrganisationForm organisation={organisation} />
      </div>
    </div>
  );
}
