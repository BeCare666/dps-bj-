"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { marquerRealiseeAction, type EtatAction } from "@/lib/admin-actions";

const ETAT_INITIAL: EtatAction = {};

function Bouton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
    >
      {pending ? "Enregistrement…" : "Clôturer la session"}
    </button>
  );
}

export function MarquerRealiseeForm({ reservationId, onSuccess }: { reservationId: string; onSuccess: () => void }) {
  const [presence, setPresence] = useState(true);
  const [etat, formAction] = useActionState(async (_prevState: EtatAction): Promise<EtatAction> => {
    return marquerRealiseeAction(reservationId, presence);
  }, ETAT_INITIAL);

  useEffect(() => {
    if (etat.succes) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.succes]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={presence}
          onChange={(e) => setPresence(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Présence confirmée
      </label>
      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <Bouton />
    </form>
  );
}
