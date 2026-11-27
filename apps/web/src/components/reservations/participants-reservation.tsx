"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/components/ui/field";
import { ajouterParticipantAction, retirerParticipantAction } from "@/lib/reservations-actions";
import type { ParticipantFormation } from "@/lib/types";

function BoutonAjouter() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
    >
      {pending ? "Ajout…" : "Ajouter le participant"}
    </button>
  );
}

function statutParticipant(p: ParticipantFormation, sessionTerminee: boolean) {
  if (sessionTerminee) return p.present ? { texte: "Présent", ton: "text-success" } : { texte: "Absent", ton: "text-text-faint" };
  if (p.invitationEnvoyeeLe) return { texte: "Invitation envoyée", ton: "text-success" };
  return { texte: "Invitation en attente", ton: "text-text-faint" };
}

// §4.3 — ajout et retrait de participants dans la limite des places réservées,
// jusqu'au début de la session.
export function ParticipantsReservation({
  reservationId,
  participants,
  places,
  modifiable,
  sessionTerminee,
}: {
  reservationId: string;
  participants: ParticipantFormation[];
  places: number;
  modifiable: boolean;
  sessionTerminee: boolean;
}) {
  const [etat, formAction] = useActionState(ajouterParticipantAction.bind(null, reservationId), {});
  const formRef = useRef<HTMLFormElement>(null);
  const [erreurRetrait, setErreurRetrait] = useState<string>();
  const [retraitEnCours, demarrerRetrait] = useTransition();
  const complet = participants.length >= places;

  useEffect(() => {
    if (etat.succes) formRef.current?.reset();
  }, [etat]);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-muted">
        {participants.length} / {places} participant{places > 1 ? "s" : ""} inscrit{participants.length > 1 ? "s" : ""}
      </p>

      {participants.length > 0 && (
        <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
          {participants.map((p) => {
            const statut = statutParticipant(p, sessionTerminee);
            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">
                    {p.nom} {p.prenom}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {p.fonction}
                    {p.service ? ` · ${p.service}` : ""} · {p.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${statut.ton}`}>{statut.texte}</span>
                  {modifiable && (
                    <button
                      type="button"
                      disabled={retraitEnCours}
                      onClick={() =>
                        demarrerRetrait(async () => {
                          const r = await retirerParticipantAction(reservationId, p.id);
                          setErreurRetrait(r.erreur);
                        })
                      }
                      className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {erreurRetrait && <p className="text-sm text-danger">{erreurRetrait}</p>}

      {modifiable && !complet && (
        <form ref={formRef} action={formAction} className="grid gap-3 rounded-[var(--radius-md)] bg-bg-subtle p-4 sm:grid-cols-2">
          <Field label="Nom" name="nom" required />
          <Field label="Prénoms" name="prenom" required />
          <Field label="Fonction" name="fonction" required placeholder="ex. Infirmier" />
          <Field label="Service" name="service" placeholder="Facultatif" />
          <Field label="Email" name="email" type="email" required />
          <Field label="Téléphone" name="telephone" type="tel" placeholder="Facultatif" />
          <div className="flex flex-col gap-2 sm:col-span-2">
            {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
            <div>
              <BoutonAjouter />
            </div>
          </div>
        </form>
      )}
      {modifiable && complet && <p className="text-xs text-text-faint">Toutes les places réservées sont attribuées.</p>}
      {!modifiable && !sessionTerminee && (
        <p className="text-xs text-text-faint">La liste des participants n&apos;est plus modifiable.</p>
      )}
    </div>
  );
}
