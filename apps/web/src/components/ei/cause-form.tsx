"use client";

import { useActionState } from "react";
import { SelectField } from "@/components/ui/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { ajouterCauseAction, type EtatAction } from "@/lib/ei-actions";

const ETAT_INITIAL: EtatAction = {};

export function CauseForm({ eiId }: { eiId: string }) {
  const action = ajouterCauseAction.bind(null, eiId);
  const [etat, formAction] = useActionState(action, ETAT_INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <SelectField label="Type de cause" name="type" defaultValue="IMMEDIATE">
        <option value="IMMEDIATE">Immédiate</option>
        <option value="PROFONDE">Profonde</option>
      </SelectField>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cause-description" className="text-sm font-medium text-text">
          Description
        </label>
        <textarea
          id="cause-description"
          name="description"
          required
          minLength={3}
          rows={3}
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
        />
      </div>
      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <div>
        <SubmitButton>Ajouter la cause</SubmitButton>
      </div>
    </form>
  );
}
