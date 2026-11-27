"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { affecterSessionAction, type EtatAction } from "@/lib/admin-actions";
import { formaterDateHeure } from "@/lib/format";
import type { SessionFormation } from "@/lib/types";

const ETAT_INITIAL: EtatAction = {};

function Bouton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
    >
      {pending ? "Enregistrement…" : "Affecter et inviter les participants"}
    </button>
  );
}

// §4.2 — affectation d'une réservation payée à une session en ligne planifiée
// de la même formation ; les participants inscrits reçoivent le lien Meet.
export function AffecterSessionForm({
  reservationId,
  sessions,
  sessionActuelleId,
  onSuccess,
}: {
  reservationId: string;
  sessions: SessionFormation[];
  sessionActuelleId?: string | null;
  onSuccess: () => void;
}) {
  const [etat, formAction] = useActionState(affecterSessionAction.bind(null, reservationId), ETAT_INITIAL);

  useEffect(() => {
    if (etat.succes) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.succes]);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Aucune session planifiée pour cette formation.{" "}
        <Link href="/admin/sessions-formation" className="font-medium text-primary hover:underline">
          Créer une session
        </Link>
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {sessions.map((s, i) => (
          <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40">
            <input type="radio" name="sessionFormationId" value={s.id} required defaultChecked={sessionActuelleId ? s.id === sessionActuelleId : i === 0} />
            <span className="text-sm text-text">{formaterDateHeure(s.debut)}</span>
            {s.placesMax && <span className="text-xs text-text-faint">{s.placesMax} places</span>}
          </label>
        ))}
      </div>
      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <Bouton />
    </form>
  );
}
