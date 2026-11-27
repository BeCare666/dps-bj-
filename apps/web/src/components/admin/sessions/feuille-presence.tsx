"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { annulerSessionAction, cloturerSessionAction, enregistrerPresencesAction } from "@/lib/sessions-formation-actions";
import type { EtatAction, SessionFormationAdmin } from "@/lib/types";

// §4.5 — présence cochée par DSP (Google Meet ne fournit pas la liste des
// présents sans Google Workspace), puis clôture de la session.
export function FeuillePresence({ session }: { session: SessionFormationAdmin }) {
  const router = useRouter();
  const reservations = session.reservations ?? [];
  const participants = reservations.flatMap((r) => r.participants);
  const [presences, setPresences] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(participants.map((p) => [p.id, p.present === true])),
  );
  const [message, setMessage] = useState<{ erreur: boolean; texte: string }>();
  const [confirmation, setConfirmation] = useState<"cloturer" | "annuler" | null>(null);
  const [enCours, demarrer] = useTransition();
  const planifiee = session.statut === "PLANIFIEE";
  const commencee = new Date(session.debut) <= new Date();

  async function executer(action: () => Promise<EtatAction>, succes: string) {
    const r = await action();
    setMessage(r.erreur ? { erreur: true, texte: r.erreur } : { erreur: false, texte: succes });
    router.refresh();
  }
  const enregistrer = () =>
    participants.length === 0
      ? Promise.resolve<EtatAction>({ succes: true })
      : enregistrerPresencesAction(
          session.id,
          participants.map((p) => ({ participantId: p.id, present: presences[p.id] ?? false })),
        );

  return (
    <div className="flex flex-col gap-5">
      {participants.length === 0 && <p className="text-sm text-text-muted">Aucun participant inscrit pour le moment.</p>}

      {reservations
        .filter((r) => r.participants.length > 0)
        .map((r) => (
          <div key={r.id}>
            <p className="text-sm font-semibold text-text">
              {r.organisation?.nom ?? (r.utilisateur ? `${r.utilisateur.prenom} ${r.utilisateur.nom}` : "Compte individuel")}
              {r.statut === "ATTENTE_PAIEMENT" && <span className="ml-2 text-xs font-normal text-warning">paiement en attente</span>}
            </p>
            <ul className="mt-2 divide-y divide-border rounded-[var(--radius-md)] border border-border">
              {r.participants.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <label className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={!planifiee}
                      checked={presences[p.id] ?? false}
                      onChange={(e) => setPresences({ ...presences, [p.id]: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-text">
                        {p.nom} {p.prenom}
                      </span>
                      <span className="block truncate text-xs text-text-muted">
                        {p.fonction}
                        {p.service ? ` · ${p.service}` : ""} · {p.email}
                      </span>
                    </span>
                  </label>
                  <span className="shrink-0 text-xs text-text-faint">
                    {planifiee ? (p.invitationEnvoyeeLe ? "Invité" : "Non invité") : p.present ? "Présent" : "Absent"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

      {message && <p className={`text-sm ${message.erreur ? "text-danger" : "text-success"}`}>{message.texte}</p>}

      {planifiee && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {participants.length > 0 && (
            <button
              type="button"
              disabled={enCours}
              onClick={() => demarrer(() => executer(enregistrer, "Présences enregistrées."))}
              className="rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-medium text-text hover:border-primary/40 disabled:opacity-50"
            >
              Enregistrer les présences
            </button>
          )}
          <button
            type="button"
            disabled={enCours || !commencee}
            title={commencee ? undefined : "Possible une fois la session commencée"}
            onClick={() => setConfirmation("cloturer")}
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            Enregistrer et clôturer
          </button>
          <button
            type="button"
            disabled={enCours}
            onClick={() => setConfirmation("annuler")}
            className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
          >
            Annuler la session
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmation === "cloturer"}
        onClose={() => setConfirmation(null)}
        onConfirm={() =>
          executer(async () => {
            const r = await enregistrer();
            return r.erreur ? r : cloturerSessionAction(session.id);
          }, "Session clôturée : les registres sont disponibles pour les établissements.")
        }
        titre="Clôturer la session ?"
        description="Les participants non cochés seront enregistrés absents et les réservations passeront « réalisées ». Cette action est définitive."
        confirmLabel="Clôturer"
        danger={false}
      />
      <ConfirmDialog
        open={confirmation === "annuler"}
        onClose={() => setConfirmation(null)}
        onConfirm={() => executer(() => annulerSessionAction(session.id), "Session annulée.")}
        titre="Annuler la session ?"
        description="Les établissements sont prévenus ; leurs réservations repassent « session à affecter »."
        confirmLabel="Annuler la session"
      />
    </div>
  );
}
