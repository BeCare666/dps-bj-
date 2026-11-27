"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { IconPlus } from "@/components/icons";
import { formaterDateHeure } from "@/lib/format";
import { creerSessionAction } from "@/lib/sessions-formation-actions";
import { SessionForm } from "./session-form";
import type { Formation, SessionFormationAdmin, StatutSessionFormation } from "@/lib/types";

export const BADGES_STATUT_SESSION: Record<StatutSessionFormation, { label: string; variant: "info" | "success" | "neutral" }> = {
  PLANIFIEE: { label: "Planifiée", variant: "info" },
  TERMINEE: { label: "Terminée", variant: "success" },
  ANNULEE: { label: "Annulée", variant: "neutral" },
};

const ONGLETS = [
  { cle: "a-venir", label: "À venir", filtre: (s: SessionFormationAdmin) => s.statut === "PLANIFIEE" && new Date(s.fin) > new Date() },
  { cle: "a-cloturer", label: "À clôturer", filtre: (s: SessionFormationAdmin) => s.statut === "PLANIFIEE" && new Date(s.fin) <= new Date() },
  { cle: "terminees", label: "Terminées", filtre: (s: SessionFormationAdmin) => s.statut === "TERMINEE" },
  { cle: "annulees", label: "Annulées", filtre: (s: SessionFormationAdmin) => s.statut === "ANNULEE" },
] as const;

// §4.1 — planning des sessions en ligne.
export function SessionsFormationAdmin({ sessions, formations }: { sessions: SessionFormationAdmin[]; formations: Formation[] }) {
  const [creation, setCreation] = useState(false);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["cle"]>("a-venir");
  const filtre = ONGLETS.find((o) => o.cle === onglet)!.filtre;
  const liste = sessions.filter(filtre).sort((a, b) =>
    onglet === "a-venir" ? a.debut.localeCompare(b.debut) : b.debut.localeCompare(a.debut),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex flex-wrap gap-2">
          {ONGLETS.map((o) => (
            <button
              key={o.cle}
              role="tab"
              type="button"
              aria-selected={onglet === o.cle}
              onClick={() => setOnglet(o.cle)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                onglet === o.cle ? "border-primary bg-primary text-white" : "border-border text-text-muted hover:text-text"
              }`}
            >
              {o.label} <span className="opacity-70">({sessions.filter(o.filtre).length})</span>
            </button>
          ))}
        </div>
        <Button onClick={() => setCreation(true)} className="h-9 gap-1.5 px-3.5">
          <IconPlus width={16} height={16} />
          Nouvelle session
        </Button>
      </div>

      {liste.length === 0 ? (
        <p className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-6 py-10 text-center text-sm text-text-muted">
          Aucune session dans cette catégorie.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-surface">
          {liste.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/sessions-formation/${s.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-bg-subtle">
                <div className="min-w-0">
                  <p className="font-medium text-text">{s.formation.titre}</p>
                  <p className="text-xs text-text-faint">
                    {s.formation.critere ? `${s.formation.typeEtablissement} ${s.formation.critere} · ` : ""}
                    {formaterDateHeure(s.debut)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span className="tabular-nums">
                    {s.nombreParticipants ?? 0}
                    {s.placesMax ? ` / ${s.placesMax}` : ""} participant{(s.nombreParticipants ?? 0) > 1 ? "s" : ""}
                  </span>
                  <Badge variant={BADGES_STATUT_SESSION[s.statut].variant}>{BADGES_STATUT_SESSION[s.statut].label}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creation} onClose={() => setCreation(false)} title="Nouvelle session en ligne">
        <SessionForm action={creerSessionAction} formations={formations} libelleBouton="Créer la session" onSuccess={() => setCreation(false)} />
      </Modal>
    </div>
  );
}
