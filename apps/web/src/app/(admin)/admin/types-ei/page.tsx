import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { TypesEiTable } from "@/components/admin/types-ei-table";
import type { TypeEi } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Types d'EI",
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

export default async function AdminTypesEiPage() {
  const types = await silencieux(apiFetchJson<TypeEi[]>("/types-ei?inclureInactifs=true"), []);

  return (
    <div>
      <p className="mb-6 text-sm text-text-muted">
        Catalogue des types d&apos;événements indésirables proposés à la déclaration.
      </p>
      <TypesEiTable types={types} />
    </div>
  );
}
