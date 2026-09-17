"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { reinitialiserMotDePasseAction, type EtatFormulaire } from "@/lib/auth-actions";

const ETAT_INITIAL: EtatFormulaire = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [etat, action] = useActionState(reinitialiserMotDePasseAction, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Field
        label="Nouveau mot de passe"
        name="nouveauMotDePasse"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      {etat.erreur && (
        <p className="rounded-[var(--radius-md)] bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{etat.erreur}</p>
      )}

      <SubmitButton>Réinitialiser le mot de passe</SubmitButton>
    </form>
  );
}
