"use client";

import { useActionState, useState } from "react";
import { FORMULAIRES_STATISTIQUES, periodeDeDate } from "@dps/shared";
import { SelectField } from "@/components/ui/field";
import { SubmitButton } from "@/components/auth/submit-button";
import { creerRapportAction, type EtatRapport } from "@/lib/rapports-statistiques-actions";

const ETAT_INITIAL: EtatRapport = {};

// Le champ <input type="week"> renvoie « AAAA-Wnn » ; l'API attend « AAAA-Snn ».
function versPeriodeApi(valeur: string): string {
  return valeur.replace("-W", "-S");
}

export function NouveauRapportForm() {
  const [etat, action] = useActionState(creerRapportAction, ETAT_INITIAL);
  const [code, setCode] = useState(FORMULAIRES_STATISTIQUES[0].code);
  const def = FORMULAIRES_STATISTIQUES.find((f) => f.code === code)!;
  const maintenant = new Date();
  const [mois, setMois] = useState(periodeDeDate("MENSUELLE", maintenant));
  const [semaine, setSemaine] = useState(periodeDeDate("HEBDOMADAIRE", maintenant).replace("-S", "-W"));
  const periode = def.periodicite === "MENSUELLE" ? mois : versPeriodeApi(semaine);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:flex-row sm:items-end">
      <div className="flex-1">
        <SelectField label="Formulaire" name="formulaireCode" value={code} onChange={(e) => setCode(e.target.value)}>
          {FORMULAIRES_STATISTIQUES.map((f) => (
            <option key={f.code} value={f.code}>
              {f.titre} ({f.periodicite === "MENSUELLE" ? "mensuel" : "hebdomadaire"})
            </option>
          ))}
        </SelectField>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="periode-saisie" className="text-sm font-medium text-text">
          {def.periodicite === "MENSUELLE" ? "Mois" : "Semaine"}
        </label>
        {def.periodicite === "MENSUELLE" ? (
          <input
            id="periode-saisie"
            type="month"
            required
            value={mois}
            onChange={(e) => setMois(e.target.value)}
            className="rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
          />
        ) : (
          <input
            id="periode-saisie"
            type="week"
            required
            value={semaine}
            onChange={(e) => setSemaine(e.target.value)}
            className="rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
          />
        )}
      </div>
      <input type="hidden" name="periode" value={periode} />
      <div className="sm:w-56">
        <SubmitButton>Commencer le rapport</SubmitButton>
      </div>
      {etat.erreur && <p className="text-sm text-danger sm:basis-full">{etat.erreur}</p>}
    </form>
  );
}
