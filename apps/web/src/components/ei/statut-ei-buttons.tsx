"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changerStatutEiAction, type EtatAction } from "@/lib/ei-actions";
import type { StatutEi } from "@/lib/types";

function Bouton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:border-primary/40 hover:bg-primary-soft/60 disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

const ETAPES: { statut: StatutEi; label: string }[] = [
  { statut: "EN_TRAITEMENT", label: "Passer en traitement" },
  { statut: "CLOTURE", label: "Clôturer" },
];

export function StatutEiButtons({ eiId, statutActuel }: { eiId: string; statutActuel: StatutEi }) {
  const ordre: Record<StatutEi, number> = { DECLARE: 0, EN_TRAITEMENT: 1, CLOTURE: 2 };
  const suivantes = ETAPES.filter((e) => ordre[e.statut] > ordre[statutActuel]);

  if (suivantes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {suivantes.map((e) => (
        <BoutonUnitaire key={e.statut} eiId={eiId} statut={e.statut} label={e.label} />
      ))}
    </div>
  );
}

function BoutonUnitaire({ eiId, statut, label }: { eiId: string; statut: StatutEi; label: string }) {
  const [etat, action] = useActionState(async (_prevState: EtatAction): Promise<EtatAction> => {
    return changerStatutEiAction(eiId, statut);
  }, {});

  return (
    <form action={action}>
      <Bouton label={label} />
      {etat.erreur && <p className="mt-2 text-xs text-danger">{etat.erreur}</p>}
    </form>
  );
}
