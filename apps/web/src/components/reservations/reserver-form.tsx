"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { PLACES_RESERVATION_MAX, TRANCHES_TARIF_FORMATION, montantReservation, prixParPersonne } from "@dps/shared";
import { formaterFcfa } from "@/lib/format";
import { creerReservationAction, type EtatAction } from "@/lib/reservations-actions";
import type { Formation } from "@/lib/types";

const ETAT_INITIAL: EtatAction = {};

const dateSession = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" });

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

// Nombre de personnes libre ; prix par personne selon la tranche du groupe.
export function ReserverForm({ formation }: { formation: Formation }) {
  const action = creerReservationAction.bind(null, formation.id);
  const [etat, formAction] = useActionState(action, ETAT_INITIAL);
  const [saisie, setSaisie] = useState("1");
  const sessions = formation.sessions ?? [];
  const nombre = Number(saisie);
  const valide = Number.isInteger(nombre) && nombre >= 1 && nombre <= PLACES_RESERVATION_MAX;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <label htmlFor="nombrePlaces" className="text-sm font-semibold text-text">
          Nombre de personnes à former
        </label>
        <input
          id="nombrePlaces"
          name="nombrePlaces"
          type="number"
          inputMode="numeric"
          min={1}
          max={PLACES_RESERVATION_MAX}
          step={1}
          required
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          className="w-40 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-base text-text focus:border-primary focus:outline-none"
        />
        <ul className="grid gap-2 sm:grid-cols-3">
          {TRANCHES_TARIF_FORMATION.map((t) => {
            const active = valide && nombre >= t.min && (t.max === null || nombre <= t.max);
            return (
              <li
                key={t.cle}
                className={`rounded-[var(--radius-lg)] border p-3 transition-colors ${
                  active ? "border-primary bg-primary-soft/40" : "border-border bg-surface"
                }`}
              >
                <p className="text-xs text-text-muted">{t.libelle}</p>
                <p className="font-display text-base font-bold text-primary">
                  {formaterFcfa(formation[t.cle])} <span className="text-xs font-medium text-text-muted">/ personne</span>
                </p>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-text" aria-live="polite">
          {valide ? (
            <>
              {nombre} personne{nombre > 1 ? "s" : ""} × {formaterFcfa(prixParPersonne(formation, nombre))} ={" "}
              <strong className="font-display text-primary">{formaterFcfa(montantReservation(formation, nombre))}</strong>
            </>
          ) : (
            <span className="text-danger">Indiquez un nombre entier entre 1 et {PLACES_RESERVATION_MAX}.</span>
          )}
        </p>
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
