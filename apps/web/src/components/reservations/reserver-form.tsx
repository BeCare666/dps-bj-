"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { formaterFcfa } from "@/lib/format";
import { creerReservationAction, type EtatAction } from "@/lib/reservations-actions";
import type { Formation, FormuleFormation } from "@/lib/types";

const ETAT_INITIAL: EtatAction = {};

const FORMULES: { valeur: FormuleFormation; label: string; description: string }[] = [
  { valeur: "INDIVIDUEL", label: "Individuel", description: "Une personne" },
  { valeur: "GROUPE_5", label: "Groupe de 5", description: "Jusqu'à 5 personnes" },
  { valeur: "GROUPE_10", label: "Groupe de 10", description: "Jusqu'à 10 personnes" },
];

const dateSession = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" });

// Formule sans tarif fixé par DSP : non réservable (« tarif à définir »).
function prixFormule(formation: Formation, formule: FormuleFormation): number | null {
  if (formule === "INDIVIDUEL") return formation.prixIndividuel;
  if (formule === "GROUPE_5") return formation.prixGroupe5;
  return formation.prixGroupe10;
}

function Bouton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
    >
      {pending ? "Création…" : "Réserver et payer"}
    </button>
  );
}

export function ReserverForm({ formation }: { formation: Formation }) {
  const action = creerReservationAction.bind(null, formation.id);
  const [etat, formAction] = useActionState(action, ETAT_INITIAL);
  const premiere = FORMULES.findIndex((f) => prixFormule(formation, f.valeur) !== null);
  const sessions = formation.sessions ?? [];
  if (premiere === -1) {
    return <p className="text-sm text-text-muted">Les tarifs de cette formation ne sont pas encore publiés : elle n&apos;est pas encore réservable.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {FORMULES.map((f, i) => {
          const prix = prixFormule(formation, f.valeur);
          return (
          <label
            key={f.valeur}
            className={`flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40 ${
              prix === null ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3">
              <input type="radio" name="formule" value={f.valeur} defaultChecked={i === premiere} disabled={prix === null} required className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium text-text">{f.label}</p>
                <p className="text-xs text-text-muted">{f.description}</p>
              </div>
            </div>
            <span className={prix !== null ? "font-display text-base font-bold text-primary" : "text-sm text-text-faint"}>
              {prix !== null ? formaterFcfa(prix) : "Tarif à définir"}
            </span>
          </label>
          );
        })}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold text-text">Session en ligne</legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40">
          <input type="radio" name="sessionFormationId" value="" defaultChecked={sessions.length === 0} className="mt-0.5 h-4 w-4" />
          <span>
            <span className="block text-sm font-medium text-text">Prochaine session disponible</span>
            <span className="block text-xs text-text-muted">DSP vous affecte à une session après le paiement.</span>
          </span>
        </label>
        {sessions.map((s, i) => (
          <label key={s.id} className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40">
            <input type="radio" name="sessionFormationId" value={s.id} defaultChecked={i === 0} className="mt-0.5 h-4 w-4" />
            <span className="text-sm font-medium text-text first-letter:uppercase">{dateSession(s.debut)}</span>
          </label>
        ))}
        <p className="text-xs leading-5 text-text-muted">
          Après la réservation, inscrivez vos participants : chacun reçoit le lien Google Meet par email dès que le
          paiement est confirmé et la session fixée.
        </p>
      </fieldset>

      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <Bouton />
    </form>
  );
}
