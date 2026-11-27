import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterFcfa } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { CouvertureFormation } from "@/components/formations/couverture-formation";
import { TRANCHES_TARIF_FORMATION } from "@dps/shared";
import { LIBELLES_NIVEAU, LIBELLES_TYPE } from "@/lib/catalogue-formations";
import type { Formation } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const formation = await apiFetchJson<Formation>(`/formations/${id}`);
    return { title: formation.titre, description: formation.description };
  } catch {
    return { title: "Formation" };
  }
}

const FUSEAU = "Africa/Porto-Novo";
const dateSession = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: FUSEAU });
const heure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU });

export default async function FormationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let formation: Formation;
  try {
    formation = await apiFetchJson<Formation>(`/formations/${id}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  // Rubriques du programme, reprises telles quelles des documents officiels.
  const programme = [
    { titre: "Objectif", texte: formation.objectifs },
    { titre: "Exigence ARS", texte: formation.exigenceArs },
    { titre: "Contenus", texte: formation.contenus },
    { titre: "Méthode", texte: formation.methode },
    { titre: "Évaluation", texte: formation.evaluation },
  ].filter((r): r is { titre: string; texte: string } => Boolean(r.texte));
  const officielle = programme.length > 0;
  const sessions = formation.sessions ?? [];
  const retour = formation.typeEtablissement === "ESPC" ? "/formations?type=ESPC" : "/formations";

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <Link href={retour} className="text-sm font-medium text-text-muted hover:text-text">
        ← Toutes les formations
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <Reveal>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {formation.typeEtablissement && (
              <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-text-muted">{LIBELLES_TYPE[formation.typeEtablissement]}</span>
            )}
            {formation.critere && <span className="rounded-full bg-bg-subtle px-2.5 py-1 font-mono text-text-muted">Critère {formation.critere}</span>}
            {formation.niveau && <span className="rounded-full bg-primary-soft px-2.5 py-1 text-primary">{LIBELLES_NIVEAU[formation.niveau]}</span>}
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-text sm:text-4xl">{formation.titre}</h1>
          {formation.domaine && <p className="mt-2 text-sm text-text-faint">Domaine {formation.domaineCode} · {formation.domaine}</p>}

          <dl className="mt-6 grid gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:grid-cols-2">
            {formation.publicCible && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-faint">Public</dt>
                <dd className="mt-1 text-sm leading-6 text-text">{formation.publicCible}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-faint">Durée</dt>
              <dd className="mt-1 text-sm leading-6 text-text">
                {formation.dureeLibelle ?? (formation.dureeHeures ? `${formation.dureeHeures} h` : "Non renseignée")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-faint">Modalité</dt>
              <dd className="mt-1 text-sm leading-6 text-text">Session en ligne (Google Meet)</dd>
            </div>
          </dl>

          {officielle ? (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold text-text">Programme</h2>
              <dl className="mt-4 divide-y divide-border">
                {programme.map((r) => (
                  <div key={r.titre} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr]">
                    <dt className="text-sm font-semibold text-text">{r.titre}</dt>
                    <dd className="text-sm leading-7 text-text-muted first-letter:uppercase">{r.texte}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : (
            <p className="mt-8 whitespace-pre-line text-base leading-7 text-text-muted">{formation.description}</p>
          )}
        </Reveal>

        <Reveal delay={0.05} className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="h-40 overflow-hidden rounded-[var(--radius-lg)]">
            <CouvertureFormation formation={formation} />
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Tarifs par personne</h2>
            <ul className="mt-3 divide-y divide-border">
              {TRANCHES_TARIF_FORMATION.map((t) => (
                <li key={t.cle} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-text-muted">{t.libelle}</span>
                  <span className="font-display font-bold text-primary">{formaterFcfa(formation[t.cle])}</span>
                </li>
              ))}
            </ul>
            <Button href={`/reserver/${formation.id}`} className="mt-4 w-full">
              Réserver cette formation
            </Button>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">Sessions à venir</h2>
            {sessions.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-text-muted">
                Aucune session planifiée. Après réservation, DSP vous affecte à la prochaine session.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {sessions.map((s) => (
                  <li key={s.id} className="rounded-[var(--radius-md)] bg-bg-subtle px-3 py-2 text-sm text-text">
                    <span className="inline-block first-letter:uppercase">{dateSession(s.debut)}</span>
                    <span className="text-text-muted"> – {heure(s.fin)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
