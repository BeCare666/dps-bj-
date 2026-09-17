"use client";

import { useActionState } from "react";
import { Field, SelectField } from "@/components/ui/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { saisirMesureAction, type EtatAction } from "@/lib/patients-actions";

const ETAT_INITIAL: EtatAction = {};

const OPTIONS_CONSCIENCE = [
  { value: "ALERTE", label: "Alerte (normal)" },
  { value: "VOIX", label: "Réagit à la voix" },
  { value: "DOULEUR", label: "Réagit à la douleur" },
  { value: "CONFUSION", label: "Confusion" },
  { value: "INCONSCIENT", label: "Inconscient" },
];

export function MesureForm({ patientId }: { patientId: string }) {
  const action = saisirMesureAction.bind(null, patientId);
  const [etat, formAction] = useActionState(action, ETAT_INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Fréquence respiratoire (/min)"
          name="frequenceRespiratoire"
          type="number"
          required
          min={0}
          max={60}
        />
        <Field label="SpO2 (%)" name="saturationOxygene" type="number" required min={0} max={100} />
        <Field
          label="Température (°C)"
          name="temperature"
          type="number"
          step="0.1"
          required
          min={25}
          max={45}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="PA systolique (mmHg)"
          name="pressionArterielleSystolique"
          type="number"
          required
          min={0}
          max={300}
        />
        <Field label="Fréquence cardiaque (/min)" name="frequenceCardiaque" type="number" required min={0} max={250} />
        <SelectField label="Niveau de conscience" name="niveauConscience" defaultValue="ALERTE" required>
          {OPTIONS_CONSCIENCE.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </div>
      <label className="flex items-center gap-2 text-sm text-text">
        <input type="checkbox" name="oxygenoSupplementation" className="h-4 w-4 rounded border-border" />
        Sous oxygénothérapie
      </label>

      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <SubmitButton>Enregistrer la mesure</SubmitButton>
    </form>
  );
}
