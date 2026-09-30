import type { Metadata } from "next";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDate } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { IconChecklist, IconVitals, IconShieldAlert, IconGraduationCap } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import type { AbonnementModule, Organisation, SessionEvaluationResume } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false, follow: false },
};

async function silencieux<T>(promesse: Promise<T>): Promise<T | null> {
  try {
    return await promesse;
  } catch (erreur) {
    if (erreur instanceof ApiError) return null;
    throw erreur;
  }
}

function StatutAbonnementBadge({ abonnement }: { abonnement: AbonnementModule | null }) {
  if (!abonnement) return <Badge variant="neutral">Non démarré</Badge>;
  if (abonnement.statut === "ACTIF") return <Badge variant="success">Actif</Badge>;
  if (abonnement.statut === "EXPIRE") return <Badge variant="danger">Expiré</Badge>;
  return <Badge variant="warning">Essai jusqu&apos;au {formaterDate(abonnement.essaiFin)}</Badge>;
}

export default async function TableauDeBordPage() {
  const [organisation, abonnementNews, abonnementEi, sessions] = await Promise.all([
    silencieux(apiFetchJson<Organisation>("/organisations/me")),
    silencieux(apiFetchJson<AbonnementModule | null>("/abonnements/NEWS")),
    silencieux(apiFetchJson<AbonnementModule | null>("/abonnements/EI")),
    silencieux(apiFetchJson<SessionEvaluationResume[]>("/sessions-evaluation")),
  ]);

  const sessionsSoumises = sessions?.filter((s) => s.statut === "SOUMISE") ?? [];
  const derniereSoumise = sessionsSoumises.at(0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <Reveal>
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Tableau de bord</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-text">
          {organisation ? organisation.nom : "Bienvenue"}
        </h1>
        {organisation && (
          <p className="mt-1 text-sm text-text-muted">
            {organisation.type === "EH" ? "Hôpital (EH)" : "Établissement de santé primaire communautaire (ESPC)"}
          </p>
        )}
      </Reveal>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Reveal>
          <Link
            href="/auto-evaluation"
            className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                <IconChecklist width={22} height={22} />
              </div>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">Gratuit</span>
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold text-text">Auto-évaluation</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-text-muted">
              {derniereSoumise
                ? `Dernier score : ${derniereSoumise.scoreGlobal}% (${formaterDate(derniereSoumise.dateSoumission!)})`
                : "Aucune évaluation soumise pour l'instant."}
            </p>
            <span className="mt-4 text-sm font-medium text-primary group-hover:underline">Accéder →</span>
          </Link>
        </Reveal>

        <Reveal delay={0.05}>
          <Link
            href="/news"
            className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                <IconVitals width={22} height={22} />
              </div>
              <StatutAbonnementBadge abonnement={abonnementNews} />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold text-text">Score NEWS</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-text-muted">
              Surveillance clinique au chevet du patient.
            </p>
            <span className="mt-4 text-sm font-medium text-primary group-hover:underline">Accéder →</span>
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <Link
            href="/evenements-indesirables"
            className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                <IconShieldAlert width={22} height={22} />
              </div>
              <StatutAbonnementBadge abonnement={abonnementEi} />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold text-text">Événements indésirables</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-text-muted">
              Déclaration, qualification et actions correctives.
            </p>
            <span className="mt-4 text-sm font-medium text-primary group-hover:underline">Accéder →</span>
          </Link>
        </Reveal>

        <Reveal delay={0.15}>
          <Link
            href="/formations"
            className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                <IconGraduationCap width={22} height={22} />
              </div>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                À l&apos;unité
              </span>
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold text-text">Formations</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-text-muted">Catalogue et réservation.</p>
            <span className="mt-4 text-sm font-medium text-primary group-hover:underline">Voir le catalogue →</span>
          </Link>
          <Link
            href="/mes-reservations"
            className="mt-3 block text-center text-xs font-medium text-text-muted hover:text-text hover:underline"
          >
            Mes réservations
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
