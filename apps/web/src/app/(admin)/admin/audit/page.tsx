import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { AuditTable } from "@/components/admin/audit-table";
import type { JournalAuditEntry } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Audit",
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

export default async function AdminAuditPage() {
  const entrees = await silencieux(apiFetchJson<JournalAuditEntry[]>("/audit"), []);

  return (
    <div>
      <p className="mb-6 text-sm text-text-muted">
        {entrees.length} action{entrees.length > 1 ? "s" : ""} tracée{entrees.length > 1 ? "s" : ""} (200 plus
        récentes maximum).
      </p>
      <AuditTable entrees={entrees} />
    </div>
  );
}
