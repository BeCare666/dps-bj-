import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { EtablissementsTable } from "@/components/admin/etablissements-table";
import type { Organisation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Établissements",
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

export default async function AdminEtablissementsPage() {
  const organisations = await silencieux(apiFetchJson<Organisation[]>("/organisations"), []);

  return (
    <div>
      <p className="mb-6 text-sm text-text-muted">
        {organisations.length} établissement{organisations.length > 1 ? "s" : ""} inscrit
        {organisations.length > 1 ? "s" : ""} sur la plateforme.
      </p>
      <EtablissementsTable organisations={organisations} />
    </div>
  );
}
