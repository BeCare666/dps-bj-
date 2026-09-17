"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { ajouterActionCorrectiveAction, type EtatAction } from "@/lib/ei-actions";

const ETAT_INITIAL: EtatAction = {};

// RM10 / limite connue : aucun endpoint de liste des membres de l'organisation
// n'existe côté API pour l'instant — l'action est donc assignée à son auteur.
// À revoir si un module de gestion d'équipe est ajouté (voir ROADMAP.md).
export function ActionCorrectiveForm({ eiId, responsableId }: { eiId: string; responsableId: string }) {
  const action = ajouterActionCorrectiveAction.bind(null, eiId);
  const [etat, formAction] = useActionState(action, ETAT_INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="responsableId" value={responsableId} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="action-description" className="text-sm font-medium text-text">
          Action corrective
        </label>
        <textarea
          id="action-description"
          name="description"
          required
          minLength={3}
          rows={3}
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
        />
      </div>
      <Field label="Échéance" name="echeance" type="date" required />
      <p className="text-xs text-text-faint">Assignée à vous-même.</p>
      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <div>
        <SubmitButton>Ajouter l&apos;action</SubmitButton>
      </div>
    </form>
  );
}
