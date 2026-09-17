"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { qualifierEiAction, type EtatAction } from "@/lib/ei-actions";
import type { GraviteEi } from "@/lib/types";

const OPTIONS: { valeur: GraviteEi; label: string; classe: string }[] = [
  { valeur: "FAIBLE", label: "Faible", classe: "hover:border-success/40 hover:bg-success-soft" },
  { valeur: "MODEREE", label: "Modérée", classe: "hover:border-warning/40 hover:bg-warning-soft" },
  { valeur: "ELEVEE", label: "Élevée", classe: "hover:border-danger/40 hover:bg-danger-soft" },
];

function Bouton({ label, classe }: { label: string; classe: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors disabled:opacity-50 ${classe}`}
    >
      {pending ? "…" : label}
    </button>
  );
}

function BoutonUnitaire({ eiId, valeur, label, classe }: { eiId: string; valeur: GraviteEi; label: string; classe: string }) {
  const [etat, action] = useActionState(async (_prevState: EtatAction): Promise<EtatAction> => {
    return qualifierEiAction(eiId, valeur);
  }, {});

  return (
    <form action={action}>
      <Bouton label={label} classe={classe} />
      {etat.erreur && <p className="mt-2 text-xs text-danger">{etat.erreur}</p>}
    </form>
  );
}

export function QualifierButtons({ eiId }: { eiId: string }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-text">Qualifier la gravité</p>
      <div className="flex flex-wrap gap-3">
        {OPTIONS.map((o) => (
          <BoutonUnitaire key={o.valeur} eiId={eiId} valeur={o.valeur} label={o.label} classe={o.classe} />
        ))}
      </div>
    </div>
  );
}
