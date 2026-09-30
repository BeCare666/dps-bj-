import type { Metadata } from "next";
import type { ReactNode } from "react";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { Reveal } from "@/components/motion/reveal";
import type { AnalyticsPlateforme } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Analytics",
  robots: { index: false, follow: false },
};

async function silencieux<T>(promesse: Promise<T>, repli: T): Promise<T> {
  try {
    return await promesse;
  } catch (erreur) {
    if (erreur instanceof ApiError) return repli;
    throw erreur;
  }
}

function Carte({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">{titre}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Repartition({ donnees, libelles }: { donnees: Record<string, number>; libelles?: Record<string, string> }) {
  const entrees = Object.entries(donnees);
  if (entrees.length === 0) return <p className="text-sm text-text-faint">Aucune donnée.</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {entrees.map(([cle, valeur]) => (
        <div key={cle} className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{libelles?.[cle] ?? cle}</span>
          <span className="font-display font-semibold text-text">{valeur}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const a = await silencieux(apiFetchJson<AnalyticsPlateforme>("/analytics"), null);

  if (!a) {
    return <p className="text-sm text-text-muted">Analytics indisponibles pour l&apos;instant.</p>;
  }

  return (
    <div>
      <Reveal>
        <p className="mb-6 text-sm text-text-muted">
          Indicateurs de la plateforme calculés en temps réel. Seules des données agrégées sont présentées
          (établissements, rôles, statuts), sans aucune information sur les patients ni sur le contenu des événements.
        </p>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-text-faint">Établissements</p>
            <p className="mt-2 font-display text-3xl font-bold text-text">
              {a.etablissements.actifs} / {a.etablissements.total}
            </p>
            <p className="mt-1 text-xs text-text-muted">actifs sur le total</p>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-text-faint">Utilisateurs</p>
            <p className="mt-2 font-display text-3xl font-bold text-text">
              {a.utilisateurs.actifs} / {a.utilisateurs.total}
            </p>
            <p className="mt-1 text-xs text-text-muted">actifs sur le total</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-text-faint">Formations</p>
            <p className="mt-2 font-display text-3xl font-bold text-text">
              {a.formations.actives} / {a.formations.total}
            </p>
            <p className="mt-1 text-xs text-text-muted">actives sur le total</p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-text-faint">Taux de clôture des EI</p>
            <p className="mt-2 font-display text-3xl font-bold text-text">{a.evenementsIndesirables.tauxClotureePct}%</p>
            <p className="mt-1 text-xs text-text-muted">
              {a.evenementsIndesirables.delaiMoyenClotureJours !== null
                ? `délai moyen ${a.evenementsIndesirables.delaiMoyenClotureJours} j`
                : "aucune clôture pour l'instant"}
            </p>
          </div>
        </Reveal>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Reveal delay={0.2}>
          <Carte titre="Utilisateurs par rôle">
            <Repartition
              donnees={a.utilisateurs.parRole}
              libelles={{
                RESPONSABLE_COMPTE: "Responsable de compte",
                RESP_QUALITE: "Responsable qualité",
                PERSONNEL_SOIGNANT: "Personnel soignant",
                GESTIONNAIRE_FORMATION: "Gestionnaire formation",
                ADMIN_PLATEFORME: "Admin plateforme",
              }}
            />
          </Carte>
        </Reveal>
        <Reveal delay={0.25}>
          <Carte titre="Établissements par type">
            <Repartition donnees={a.etablissements.parType} libelles={{ EH: "Hôpital (EH)", ESPC: "ESPC" }} />
          </Carte>
        </Reveal>
        <Reveal delay={0.3}>
          <Carte titre="Réservations par statut">
            <Repartition
              donnees={a.reservationsParStatut}
              libelles={{
                ATTENTE_PAIEMENT: "En attente de paiement",
                PAYEE: "Payée",
                CONFIRMEE: "Confirmée",
                REALISEE: "Réalisée",
                ANNULEE: "Annulée",
              }}
            />
          </Carte>
        </Reveal>
        <Reveal delay={0.35}>
          <Carte titre="Événements indésirables par gravité">
            <Repartition
              donnees={a.evenementsIndesirables.parGravite}
              libelles={{ FAIBLE: "Faible", MODEREE: "Modérée", ELEVEE: "Élevée" }}
            />
          </Carte>
        </Reveal>
        <Reveal delay={0.4}>
          <Carte titre="Mesures NEWS par niveau de risque">
            <Repartition
              donnees={a.mesuresNewsParNiveau}
              libelles={{ BAS: "Bas", MOYEN: "Moyen", ELEVE: "Élevé" }}
            />
          </Carte>
        </Reveal>
        <Reveal delay={0.45}>
          <Carte titre="Score moyen d'auto-évaluation par type d'établissement">
            <p className="mb-2 text-xs text-text-faint">{a.autoEvaluation.nombreSessionsSoumises} session(s) soumise(s) au total</p>
            <Repartition
              donnees={Object.fromEntries(Object.entries(a.autoEvaluation.scoreMoyenParType).map(([k, v]) => [k, v]))}
              libelles={{ EH: "Hôpital (EH)", ESPC: "ESPC" }}
            />
          </Carte>
        </Reveal>
      </div>
    </div>
  );
}
