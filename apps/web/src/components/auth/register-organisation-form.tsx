"use client";

import { useActionState } from "react";
import { Field, SelectField } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { AcceptationCgu } from "./acceptation-cgu";
import { inscrireOrganisationAction, type EtatFormulaire } from "@/lib/auth-actions";

const ETAT_INITIAL: EtatFormulaire = {};

export function RegisterOrganisationForm() {
  const [etat, action] = useActionState(inscrireOrganisationAction, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-faint">Établissement</legend>
        <Field label="Nom de l'établissement" name="organisationNom" required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="IFU" name="organisationIfu" required />
          <SelectField label="Type" name="organisationType" defaultValue="EH" required>
            <option value="EH">Hôpital (EH)</option>
            <option value="ESPC">ESPC</option>
          </SelectField>
        </div>
        <Field label="Adresse (optionnel)" name="organisationAdresse" />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-faint">Responsable</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom" name="responsableNom" required />
          <Field label="Prénom" name="responsablePrenom" required />
        </div>
        <Field label="Email" name="responsableEmail" type="email" autoComplete="email" required />
        <Field label="Téléphone (optionnel)" name="responsableTelephone" type="tel" />
        <Field
          label="Mot de passe"
          name="motDePasse"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </fieldset>

      {etat.erreur && (
        <p className="rounded-[var(--radius-md)] bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{etat.erreur}</p>
      )}

      <AcceptationCgu />

      <SubmitButton>Créer le compte établissement</SubmitButton>
    </form>
  );
}
