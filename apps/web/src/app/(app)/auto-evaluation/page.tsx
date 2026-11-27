import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { apiFetchJson, silencieux } from "@/lib/api-server";
import { formaterDate, formaterDateCourte, formaterPourcentage } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { IconArrowRight, IconCheckCircle, IconChecklist, IconClock, IconTrendingUp } from "@/components/icons";
import { EvolutionChart } from "@/components/auto-evaluation/evolution-chart";
import { HistoriqueTable } from "@/components/auto-evaluation/historique-table";
import {
  libelleNiveau,
  niveauDeGrille,
  ORDRE_NIVEAU,
  ReferentielsTable,
  type LigneReferentiel,
} from "@/components/auto-evaluation/referentiels-table";
import type { Grille, Organisation, SessionEvaluationResume } from "@/lib/types";

export const metadata: Metadata = {
  title: "Auto-évaluation",
  robots: { index: false, follow: false },
};

function TitreSection({ children, compteur, description }: { children: ReactNode; compteur?: number; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text">
        {children}
        {compteur !== undefined && (
          <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-medium text-text-muted tabular-nums">{compteur}</span>
        )}
      </h2>
      {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
    </div>
  );
}

const plusRecente = (a: SessionEvaluationResume, b: SessionEvaluationResume) =>
  (b.dateSoumission ?? b.dateDebut).localeCompare(a.dateSoumission ?? a.dateDebut);

function formaterEcart(points: number): string {
  const arrondi = Math.round(points * 100) / 100;
  return `${arrondi > 0 ? "+" : ""}${arrondi.toLocaleString("fr-FR")} pts`;
}

export default async function AutoEvaluationPage() {
  const organisation = await silencieux(apiFetchJson<Organisation | null>("/organisations/me"), null);
  const [grilles, sessions] = await Promise.all([
    silencieux(apiFetchJson<Grille[]>(`/grilles${organisation ? `?type=${organisation.type}` : ""}`), []),
    silencieux(apiFetchJson<SessionEvaluationResume[]>("/sessions-evaluation"), []),
  ]);

  const enCours = sessions.filter((s) => s.statut === "EN_COURS").sort(plusRecente);
  const soumises = sessions.filter((s) => s.statut === "SOUMISE" && s.scoreGlobal !== null).sort(plusRecente);

  // Référentiels : une ligne par grille publiée, dans l'ordre des niveaux ARS.
  // Le dernier résultat et le nombre d'évaluations portent sur toutes les
  // versions d'une même grille (même nom).
  const lignes: LigneReferentiel[] = [...grilles]
    .sort((a, b) => ORDRE_NIVEAU[niveauDeGrille(a)] - ORDRE_NIVEAU[niveauDeGrille(b)] || a.nom.localeCompare(b.nom, "fr"))
    .map((grille) => {
      const soumisesGrille = soumises.filter((s) => s.grille.nom === grille.nom);
      return {
        grille,
        enCours: enCours.find((s) => s.grille.id === grille.id) ?? null,
        derniere: soumisesGrille[0] ?? null,
        nombreSoumises: soumisesGrille.length,
      };
    });
  // Sessions ouvertes sur une version antérieure, archivée depuis : toujours reprenables.
  const enCoursAnciennes = enCours.filter((s) => !grilles.some((g) => g.id === s.grille.id));

  // Indicateurs : valeurs réelles uniquement.
  const derniere = soumises[0] ?? null;
  const precedenteMemeGrille = derniere ? soumises.find((s) => s.id !== derniere.id && s.grille.nom === derniere.grille.nom) : undefined;
  const ecart =
    derniere && precedenteMemeGrille && precedenteMemeGrille.scoreGlobal !== null
      ? derniere.scoreGlobal! - precedenteMemeGrille.scoreGlobal
      : null;
  const referentielsEvalues = new Set(soumises.map((s) => s.grille.nom)).size;
  const points = [...soumises]
    .reverse()
    .map((s) => ({ date: formaterDateCourte(s.dateSoumission ?? s.dateDebut), score: s.scoreGlobal!, grille: s.grille.nom }));
  const nomCourt = (nom: string) => libelleNiveau(niveauDeGrille({ nom, categorie: null }));

  return (
    <PageContainer>
      <Reveal>
        <PageHeader
          surtitre="Qualité & sécurité des soins"
          titre="Auto-évaluation"
          description={`Référentiels officiels de l'ARS${organisation ? ` pour les ${organisation.type}` : ""} : critères essentiels, fondamentaux et avancés. Le score est calculé par la plateforme à la soumission.`}
        />
      </Reveal>

      <Reveal delay={0.05} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Dernier score"
          valeur={derniere ? formaterPourcentage(derniere.scoreGlobal!) : "—"}
          sousTexte={
            derniere
              ? `${nomCourt(derniere.grille.nom)}${derniere.dateSoumission ? ` · ${formaterDate(derniere.dateSoumission)}` : ""}`
              : "Aucune évaluation soumise"
          }
          icone={IconChecklist}
          href={derniere ? `/auto-evaluation/${derniere.id}/resultats` : undefined}
        />
        <StatCard
          label="Évolution"
          valeur={ecart !== null ? formaterEcart(ecart) : "—"}
          sousTexte={
            ecart !== null
              ? "par rapport à l'évaluation précédente du même référentiel"
              : derniere
                ? "Première évaluation sur ce référentiel"
                : "Disponible après deux évaluations"
          }
          icone={IconTrendingUp}
          ton={ecart === null ? "neutral" : ecart >= 0 ? "success" : "warning"}
        />
        <StatCard
          label="Évaluations soumises"
          valeur={`${soumises.length}`}
          sousTexte={`${referentielsEvalues} référentiel${referentielsEvalues > 1 ? "s" : ""} évalué${referentielsEvalues > 1 ? "s" : ""} sur ${grilles.length}`}
          icone={IconCheckCircle}
          ton="success"
        />
        <StatCard
          label="Sessions en cours"
          valeur={`${enCours.length}`}
          sousTexte={enCours.length > 0 ? "reprise exacte à la dernière question" : "Aucune session ouverte"}
          icone={IconClock}
          ton={enCours.length > 0 ? "info" : "neutral"}
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <TitreSection
          compteur={lignes.length}
          description="Commencez par les critères essentiels : leur respect intégral conditionne le premier niveau de conformité."
        >
          Référentiels ARS
        </TitreSection>
        {lignes.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-5 py-8 text-center text-sm text-text-muted">
            Aucune grille disponible pour votre type d&apos;établissement pour le moment.
          </p>
        ) : (
          <ReferentielsTable lignes={lignes} />
        )}

        {enCoursAnciennes.length > 0 && (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-4">
            <p className="text-sm font-medium text-text">Sessions ouvertes sur une version antérieure d&apos;une grille</p>
            <ul className="mt-2 flex flex-col divide-y divide-border">
              {enCoursAnciennes.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="min-w-0 text-text-muted">
                    {s.grille.nom} · version {s.grille.version} · démarrée le {formaterDate(s.dateDebut)}
                    {s.nombreReponses !== undefined && s.nombreQuestions ? ` · ${s.nombreReponses} / ${s.nombreQuestions} réponses` : ""}
                  </span>
                  <Link href={`/auto-evaluation/${s.id}`} className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline">
                    Reprendre <IconArrowRight width={14} height={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Reveal>

      {soumises.length > 0 && (
        <Reveal delay={0.15} className="mt-10 grid gap-6 xl:grid-cols-5">
          <Card className="xl:col-span-2">
            <CardHeader titre="Évolution des scores" description="Évaluations soumises, tous référentiels" />
            {points.length > 1 ? (
              <EvolutionChart points={points} />
            ) : (
              <p className="flex h-[240px] items-center justify-center px-6 text-center text-sm text-text-faint">
                La courbe apparaîtra à partir de la deuxième évaluation soumise.
              </p>
            )}
          </Card>
          <div className="min-w-0 xl:col-span-3">
            <TitreSection compteur={soumises.length}>Historique</TitreSection>
            <HistoriqueTable sessions={soumises} />
          </div>
        </Reveal>
      )}
    </PageContainer>
  );
}
