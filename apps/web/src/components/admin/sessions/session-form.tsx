"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Field, SelectField } from "@/components/ui/field";
import type { EtatAction, Formation, SessionFormation } from "@/lib/types";

function Bouton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50">
      {pending ? "Enregistrement…" : label}
    </button>
  );
}

// Valeur datetime-local à l'heure du Bénin (UTC+1).
const versLocal = (iso?: string) => (iso ? new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 16) : undefined);

export function SessionForm({
  action,
  formations,
  session,
  libelleBouton,
  onSuccess,
}: {
  action: (etat: EtatAction, formData: FormData) => Promise<EtatAction>;
  formations?: Formation[];
  session?: SessionFormation;
  libelleBouton: string;
  onSuccess?: () => void;
}) {
  const [etat, formAction] = useActionState(action, {});
  useEffect(() => {
    if (etat.succes) onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {formations && (
        <SelectField label="Formation" name="formationId" required defaultValue="">
          <option value="" disabled>
            Choisir une formation
          </option>
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.critere ? `${f.typeEtablissement} ${f.critere} · ` : ""}
              {f.titre}
            </option>
          ))}
        </SelectField>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Début (heure du Bénin)" name="debut" type="datetime-local" required defaultValue={versLocal(session?.debut)} />
        <Field label="Fin" name="fin" type="datetime-local" required defaultValue={versLocal(session?.fin)} />
      </div>
      <Field label="Lien Google Meet" name="lienMeet" type="url" required placeholder="https://meet.google.com/…" defaultValue={session?.lienMeet ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code de la réunion" name="codeMeet" placeholder="Facultatif" defaultValue={session?.codeMeet ?? ""} />
        <Field label="Places (tous établissements)" name="placesMax" type="number" min={1} placeholder="Illimité" defaultValue={session?.placesMax ?? undefined} />
      </div>
      {session && <p className="text-xs text-text-faint">Un changement de lien, de code ou d&apos;horaire renvoie l&apos;invitation à tous les participants.</p>}
      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      {etat.succes && !onSuccess && <p className="text-sm text-success">Session enregistrée.</p>}
      <div>
        <Bouton label={libelleBouton} />
      </div>
    </form>
  );
}
