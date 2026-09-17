"use client";

import { useActionState } from "react";
import { SelectField } from "@/components/ui/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { declarerEiAction, type EtatAction } from "@/lib/ei-actions";
import type { TypeEi } from "@/lib/types";

const ETAT_INITIAL: EtatAction = {};

export function DeclarerForm({ typesEi }: { typesEi: TypeEi[] }) {
  const [etat, action] = useActionState(declarerEiAction, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-text">
          Description de l&apos;événement
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={5}
          rows={5}
          placeholder="Décrivez ce qui s'est passé, le contexte, les personnes concernées…"
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
        />
      </div>

      {typesEi.length > 0 && (
        <SelectField label="Type d'événement" name="typeEiId" defaultValue="">
          <option value="">Non précisé</option>
          {typesEi.map((t) => (
            <option key={t.id} value={t.id}>
              {t.libelle}
            </option>
          ))}
        </SelectField>
      )}

      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <SubmitButton>Déclarer l&apos;événement</SubmitButton>
    </form>
  );
}
