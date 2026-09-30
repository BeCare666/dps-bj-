import type { Metadata } from "next";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { aRole, ROLES_TRAITEMENT_EI } from "@/lib/session";
import { formaterDate } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { GraviteBadge, StatutEiBadge } from "@/components/ei/badges";
import type { EvenementIndesirable } from "@/lib/types";

export const metadata: Metadata = {
  title: "Événements indésirables",
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

export default async function EvenementsIndesirablesPage() {
  const [evenements, peutTraiter] = await Promise.all([
    silencieux(apiFetchJson<EvenementIndesirable[]>("/evenements-indesirables"), []),
    aRole(...ROLES_TRAITEMENT_EI),
  ]);

  const nonQualifies = evenements.filter((e) => !e.gravite).length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Reveal className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Module EI</span>
          <h1 className="mt-2 font-display text-3xl font-bold text-text">Événements indésirables</h1>
          <p className="mt-2 text-text-muted">Déclaration, qualification et suivi des actions correctives.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {peutTraiter && (
            <Button variant="secondary" href="/evenements-indesirables/tableau-de-bord">
              Tableau de bord
            </Button>
          )}
          <Button href="/evenements-indesirables/nouveau">+ Déclarer</Button>
        </div>
      </Reveal>

      {peutTraiter && nonQualifies > 0 && (
        <Reveal delay={0.05} className="mt-8">
          <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-warning/30 bg-warning-soft px-5 py-4">
            <p className="text-sm font-medium text-warning">
              {nonQualifies} événement{nonQualifies > 1 ? "s" : ""} en attente de qualification
            </p>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.1} className="mt-8 flex flex-col gap-3">
        {evenements.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-5 py-8 text-center text-sm text-text-muted">
            Aucun événement déclaré pour l&apos;instant.
          </p>
        ) : (
          evenements.map((e) => (
            <Link
              key={e.id}
              href={`/evenements-indesirables/${e.id}`}
              className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-colors hover:border-primary/30"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-text">{e.description}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Déclaré le {formaterDate(e.dateDeclaration)}
                  {e.typeEi ? ` · ${e.typeEi.libelle}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <GraviteBadge gravite={e.gravite} />
                <StatutEiBadge statut={e.statut} />
              </div>
            </Link>
          ))
        )}
      </Reveal>
    </div>
  );
}
