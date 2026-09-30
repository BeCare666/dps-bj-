import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { FormationsTable } from "@/components/admin/formations-table";
import type { Formation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Formations",
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

export default async function AdminFormationsPage() {
  const formations = await silencieux(apiFetchJson<Formation[]>("/formations?inclureInactives=true"), []);

  return (
    <div>
      <p className="mb-6 text-sm text-text-muted">
        {formations.length} formation{formations.length > 1 ? "s" : ""} au catalogue (actives et inactives).
      </p>
      <FormationsTable formations={formations} />
    </div>
  );
}
