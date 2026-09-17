import { notFound } from "next/navigation";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { obtenirSession, aRole, ROLES_TRAITEMENT_EI } from "@/lib/session";
import { formaterDate, formaterDateHeure } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { GraviteBadge, StatutActionBadge, StatutEiBadge } from "@/components/ei/badges";
import { QualifierButtons } from "@/components/ei/qualifier-buttons";
import { CauseForm } from "@/components/ei/cause-form";
import { ActionCorrectiveForm } from "@/components/ei/action-corrective-form";
import { StatutActionButtons } from "@/components/ei/statut-action-buttons";
import { StatutEiButtons } from "@/components/ei/statut-ei-buttons";
import { PieceJointeForm } from "@/components/ei/piece-jointe-form";
import type { EvenementIndesirable } from "@/lib/types";

export default async function EvenementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let evenement: EvenementIndesirable;
  try {
    evenement = await apiFetchJson<EvenementIndesirable>(`/evenements-indesirables/${id}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  const [session, peutTraiter] = await Promise.all([obtenirSession(), aRole(...ROLES_TRAITEMENT_EI)]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <Reveal className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Événement indésirable</span>
          <h1 className="mt-2 max-w-xl font-display text-2xl font-bold text-text">{evenement.description}</h1>
          <p className="mt-2 text-sm text-text-muted">
            Déclaré le {formaterDate(evenement.dateDeclaration)}
            {evenement.declarePar ? ` par ${evenement.declarePar.prenom} ${evenement.declarePar.nom}` : ""}
            {evenement.typeEi ? ` — ${evenement.typeEi.libelle}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GraviteBadge gravite={evenement.gravite} />
          <StatutEiBadge statut={evenement.statut} />
        </div>
      </Reveal>

      {peutTraiter && !evenement.gravite && (
        <Reveal delay={0.05} className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <QualifierButtons eiId={evenement.id} />
        </Reveal>
      )}

      {peutTraiter && evenement.statut !== "CLOTURE" && evenement.gravite && (
        <Reveal delay={0.05} className="mt-8">
          <StatutEiButtons eiId={evenement.id} statutActuel={evenement.statut} />
        </Reveal>
      )}

      <Reveal delay={0.1} className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          Causes ({evenement.causes?.length ?? 0})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {evenement.causes?.map((c) => (
            <div key={c.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-text-faint">
                {c.type === "IMMEDIATE" ? "Cause immédiate" : "Cause profonde"}
              </span>
              <p className="mt-1 text-sm text-text">{c.description}</p>
            </div>
          ))}
        </div>
        {peutTraiter && (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <CauseForm eiId={evenement.id} />
          </div>
        )}
      </Reveal>

      <Reveal delay={0.15} className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          Actions correctives ({evenement.actionsCorrectives?.length ?? 0})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {evenement.actionsCorrectives?.map((a) => (
            <div key={a.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-text">{a.description}</p>
                <StatutActionBadge statut={a.statut} />
              </div>
              <p className="mt-1.5 text-xs text-text-faint">Échéance : {formaterDate(a.echeance)}</p>
              {peutTraiter && a.statut !== "REALISEE" && (
                <div className="mt-3">
                  <StatutActionButtons eiId={evenement.id} actionId={a.id} statutActuel={a.statut} />
                </div>
              )}
            </div>
          ))}
        </div>
        {peutTraiter && session && (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <ActionCorrectiveForm eiId={evenement.id} responsableId={session.sub} />
          </div>
        )}
      </Reveal>

      <Reveal delay={0.2} className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">
          Pièces jointes ({evenement.piecesJointes?.length ?? 0})
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {evenement.piecesJointes?.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-primary transition-colors hover:border-primary/30"
            >
              <span className="truncate">{p.nomFichier}</span>
              <span className="shrink-0 text-xs text-text-faint">{formaterDateHeure(p.createdAt)}</span>
            </a>
          ))}
        </div>
        {peutTraiter && (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <PieceJointeForm eiId={evenement.id} />
          </div>
        )}
      </Reveal>

      {evenement.transitions && evenement.transitions.length > 0 && (
        <Reveal delay={0.25} className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Historique des statuts</h2>
          <div className="mt-3 flex flex-col gap-2">
            {evenement.transitions.map((t) => (
              <p key={t.id} className="text-xs text-text-muted">
                {formaterDateHeure(t.createdAt)} — {t.ancienStatut} → {t.nouveauStatut}
              </p>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
