"use client";

import { useActionState } from "react";
import { Field, SelectField } from "@/components/ui/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { creerPatientAction, type EtatAction } from "@/lib/patients-actions";

const ETAT_INITIAL: EtatAction = {};

export function PatientForm() {
  const [etat, action] = useActionState(creerPatientAction, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" name="nom" required minLength={2} />
        <Field label="Prénom" name="prenom" required minLength={2} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date de naissance" name="dateNaissance" type="date" />
        <SelectField label="Sexe" name="sexe" defaultValue="">
          <option value="">Non précisé</option>
          <option value="M">Masculin</option>
          <option value="F">Féminin</option>
        </SelectField>
      </div>
      <Field label="Numéro de dossier" name="numeroDossier" placeholder="Optionnel" />

      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <SubmitButton>Créer la fiche patient</SubmitButton>
    </form>
  );
}
