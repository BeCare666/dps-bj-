import Link from "next/link";
import { formaterDate, formaterPourcentage } from "@/lib/format";
import { DemarrerSessionButton } from "@/components/auto-evaluation/demarrer-session-button";
import { IconArrowRight } from "@/components/icons";
import type { Grille, SessionEvaluationResume } from "@/lib/types";

// Niveaux des manuels ARS (§ 2.2) : essentiels (condition du 1er niveau de
// conformité), fondamentaux, avancés. Déduits de la catégorie des critères de
// la grille, à défaut de son nom.
export type Niveau = "ESSENTIEL" | "FONDAMENTAL" | "AVANCE" | "AUTRE";

export function niveauDeGrille(grille: Pick<Grille, "nom" | "categorie">): Niveau {
  const texte = `${grille.categorie ?? ""} ${grille.nom}`.toLowerCase();
  if (texte.includes("essentiel")) return "ESSENTIEL";
  if (texte.includes("fondamenta")) return "FONDAMENTAL";
  if (texte.includes("avanc")) return "AVANCE";
  return "AUTRE";
}

export const ORDRE_NIVEAU: Record<Niveau, number> = { ESSENTIEL: 0, FONDAMENTAL: 1, AVANCE: 2, AUTRE: 3 };

const NIVEAUX: Record<Niveau, { rang: string; libelle: string; regle: string; detail: string; pastille: string }> = {
  ESSENTIEL: {
    rang: "Niveau 1",
    libelle: "Critères essentiels",
    regle: "Respect intégral",
    detail: "Tous les documents présents → 1, sinon 0",
    pastille: "bg-primary text-primary-foreground",
  },
  FONDAMENTAL: {
    rang: "Niveau 2",
    libelle: "Critères fondamentaux",
    regle: "Notation par paliers",
    detail: "≥ 80 % des documents → 1 · 30 à 79 % → 0,5",
    pastille: "bg-primary-soft text-primary",
  },
  AVANCE: {
    rang: "Niveau 3",
    libelle: "Critères avancés",
    regle: "Notation par paliers",
    detail: "≥ 80 % des documents → 1 · 30 à 79 % → 0,5",
    pastille: "bg-accent-soft text-accent",
  },
  AUTRE: {
    rang: "Grille",
    libelle: "Grille d'évaluation",
    regle: "Respect intégral",
    detail: "Tous les documents présents → 1, sinon 0",
    pastille: "bg-bg-subtle text-text-muted",
  },
};

export function libelleNiveau(niveau: Niveau): string {
  return NIVEAUX[niveau].libelle;
}

function pourcentage(valeur: number, total: number): number {
  return total > 0 ? Math.round((valeur / total) * 100) : 0;
}

function BarreScore({ valeur, ton = "primary" }: { valeur: number; ton?: "primary" | "muted" }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
      <span
        className={`block h-full rounded-full ${ton === "primary" ? "bg-primary" : "bg-text-faint"}`}
        style={{ width: `${Math.max(0, Math.min(100, valeur))}%` }}
      />
    </span>
  );
}

export interface LigneReferentiel {
  grille: Grille;
  enCours: SessionEvaluationResume | null;
  derniere: SessionEvaluationResume | null;
  nombreSoumises: number;
}

// §6.1 / §6.2 — référentiels ARS proposés à l'établissement : un tableau, une
// ligne par grille, dans l'ordre des niveaux, avec le dernier résultat et
// l'avancement de la session en cours. Données réelles uniquement.
export function ReferentielsTable({ lignes }: { lignes: LigneReferentiel[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-subtle/60 text-left text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-faint">
              <th scope="col" className="px-5 py-3 font-semibold">Référentiel</th>
              <th scope="col" className="px-4 py-3 font-semibold">Périmètre</th>
              <th scope="col" className="px-4 py-3 font-semibold">Règle de notation</th>
              <th scope="col" className="w-44 px-4 py-3 font-semibold">Dernier résultat</th>
              <th scope="col" className="w-52 px-4 py-3 font-semibold">Session en cours</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lignes.map(({ grille, enCours, derniere, nombreSoumises }) => {
              const niveau = NIVEAUX[niveauDeGrille(grille)];
              const repondues = enCours?.nombreReponses;
              const total = enCours?.nombreQuestions;
              const avancement = repondues !== undefined && total ? pourcentage(repondues, total) : null;
              const question =
                enCours?.positionQuestion !== null && enCours?.positionQuestion !== undefined && total
                  ? Math.min(enCours.positionQuestion + 1, total)
                  : null;
              return (
                <tr key={grille.id} className="align-middle transition-colors hover:bg-bg-subtle/40">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3.5">
                      <span
                        className={`mt-0.5 inline-flex h-9 min-w-[4.25rem] shrink-0 items-center justify-center rounded-[var(--radius-md)] px-2 text-[0.7rem] font-bold uppercase tracking-[0.06em] ${niveau.pastille}`}
                      >
                        {niveau.rang}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-[0.95rem] font-semibold text-text">{niveau.libelle}</p>
                        <p className="mt-0.5 text-xs text-text-muted" title={grille.nom}>
                          Référentiel {grille.type} · version {grille.version}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {grille.nombreCriteres !== undefined ? (
                      <>
                        <p className="font-medium text-text tabular-nums">{grille.nombreCriteres} critères</p>
                        <p className="mt-0.5 text-xs text-text-faint tabular-nums">{grille.nombreQuestions} questions</p>
                      </>
                    ) : (
                      <span className="text-text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-text">{niveau.regle}</p>
                    <p className="mt-0.5 max-w-[13rem] text-xs leading-5 text-text-faint">{niveau.detail}</p>
                  </td>
                  <td className="px-4 py-4">
                    {derniere && derniere.scoreGlobal !== null ? (
                      <Link href={`/auto-evaluation/${derniere.id}/resultats`} className="group block">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-display text-lg font-bold text-text tabular-nums group-hover:text-primary">
                            {formaterPourcentage(derniere.scoreGlobal)}
                          </span>
                          <span className="text-xs text-text-faint tabular-nums">
                            {nombreSoumises} éval.
                          </span>
                        </span>
                        <span className="mt-1.5 block">
                          <BarreScore valeur={derniere.scoreGlobal} />
                        </span>
                        {derniere.dateSoumission && (
                          <span className="mt-1.5 block text-xs text-text-faint">le {formaterDate(derniere.dateSoumission)}</span>
                        )}
                      </Link>
                    ) : (
                      <span className="text-xs text-text-faint">Jamais évaluée</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {enCours ? (
                      <div>
                        <span className="flex items-baseline justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            En cours
                          </span>
                          {avancement !== null && <span className="font-semibold text-text tabular-nums">{formaterPourcentage(avancement)}</span>}
                        </span>
                        {avancement !== null && (
                          <span className="mt-1.5 block">
                            <BarreScore valeur={avancement} />
                          </span>
                        )}
                        <span className="mt-1.5 block whitespace-nowrap text-xs text-text-faint tabular-nums">
                          {repondues !== undefined && total ? `${repondues} / ${total} réponses` : `Démarrée le ${formaterDate(enCours.dateDebut)}`}
                          {question !== null && ` · question ${question}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-faint">Aucune</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {enCours ? (
                      <Link
                        href={`/auto-evaluation/${enCours.id}`}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                      >
                        Reprendre
                        <IconArrowRight width={15} height={15} />
                      </Link>
                    ) : (
                      <DemarrerSessionButton grilleId={grille.id} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
