"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "motion/react";
import { enregistrerReponseAction, soumettreSessionAction } from "@/lib/session-actions";
import type { SessionEvaluation } from "@/lib/types";

type ValeurReponse = boolean | string | undefined;

function construireEtatInitial(session: SessionEvaluation): Record<string, ValeurReponse> {
  const etat: Record<string, ValeurReponse> = {};
  for (const reponse of session.reponses) {
    etat[reponse.elementMesurableId] = reponse.valeur as ValeurReponse;
  }
  return etat;
}

function compterElements(session: SessionEvaluation): number {
  let total = 0;
  for (const domaine of session.grille.domaines ?? []) {
    for (const norme of domaine.normes) {
      for (const critere of norme.criteres) {
        total += critere.elementsMesurables.length;
      }
    }
  }
  return total;
}

export function Questionnaire({ session }: { session: SessionEvaluation }) {
  const [reponses, setReponses] = useState<Record<string, ValeurReponse>>(() => construireEtatInitial(session));
  const [enregistrement, setEnregistrement] = useState<string | null>(null);
  const [erreurSoumission, setErreurSoumission] = useState<string | undefined>();
  const [pendingSoumission, startSoumission] = useTransition();

  const totalElements = useMemo(() => compterElements(session), [session]);
  const nombreRepondus = Object.values(reponses).filter((v) => v !== undefined && v !== "").length;
  const progression = totalElements > 0 ? Math.round((nombreRepondus / totalElements) * 100) : 0;

  async function repondre(elementId: string, valeur: ValeurReponse) {
    setReponses((prev) => ({ ...prev, [elementId]: valeur }));
    setEnregistrement(elementId);
    const resultat = await enregistrerReponseAction(session.id, elementId, valeur);
    setEnregistrement(null);
    if (!resultat.succes) {
      setErreurSoumission(resultat.erreur);
    }
  }

  function soumettre() {
    startSoumission(async () => {
      const resultat = await soumettreSessionAction(session.id);
      if (resultat?.erreur) setErreurSoumission(resultat.erreur);
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-5 py-10 sm:px-8">
      <aside className="hidden w-56 flex-shrink-0 lg:block">
        <div className="sticky top-24 flex flex-col gap-1">
          {(session.grille.domaines ?? []).map((domaine) => (
            <a
              key={domaine.id}
              href={`#domaine-${domaine.id}`}
              className="rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-muted hover:bg-bg-subtle hover:text-text"
            >
              {domaine.nom}
            </a>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-16 z-10 -mx-5 mb-8 border-b border-border bg-bg-subtle/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text">{session.grille.nom}</span>
            <span className="text-text-muted">
              {nombreRepondus} / {totalElements} répondus
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${progression}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-10">
          {(session.grille.domaines ?? []).map((domaine) => (
            <section key={domaine.id} id={`domaine-${domaine.id}`} className="scroll-mt-32">
              <h2 className="font-display text-xl font-bold text-text">{domaine.nom}</h2>

              <div className="mt-4 flex flex-col gap-5">
                {domaine.normes.flatMap((norme) =>
                  norme.criteres.map((critere) => (
                    <div key={critere.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
                        {norme.code} · {critere.code}
                      </p>
                      <p className="mt-1 font-medium text-text">{critere.libelle}</p>

                      <div className="mt-4 flex flex-col gap-3">
                        {critere.elementsMesurables.map((element) => (
                          <div
                            key={element.id}
                            className="flex flex-col gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="text-sm text-text">{element.libelle}</span>

                            {element.typeReponse === "OUI_NON" && (
                              <div className="flex flex-shrink-0 gap-2">
                                {[
                                  { valeur: true, label: "Oui" },
                                  { valeur: false, label: "Non" },
                                ].map((option) => (
                                  <button
                                    key={option.label}
                                    type="button"
                                    onClick={() => repondre(element.id, option.valeur)}
                                    className={`rounded-[var(--radius-md)] px-4 py-1.5 text-sm font-medium transition-colors ${
                                      reponses[element.id] === option.valeur
                                        ? "bg-primary text-primary-foreground"
                                        : "border border-border bg-bg text-text-muted hover:border-primary/40"
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {element.typeReponse === "CHOIX" && element.optionsChoix && (
                              <select
                                value={(reponses[element.id] as string) ?? ""}
                                onChange={(e) => repondre(element.id, e.target.value)}
                                className="rounded-[var(--radius-md)] border border-border bg-bg px-3 py-1.5 text-sm text-text"
                              >
                                <option value="">Sélectionner…</option>
                                {element.optionsChoix.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {element.typeReponse === "TEXTE" && (
                              <input
                                type="text"
                                value={(reponses[element.id] as string) ?? ""}
                                onChange={(e) => repondre(element.id, e.target.value)}
                                className="w-full max-w-xs rounded-[var(--radius-md)] border border-border bg-bg px-3 py-1.5 text-sm text-text sm:w-auto"
                              />
                            )}

                            {enregistrement === element.id && (
                              <span className="text-xs text-text-faint">Enregistrement…</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )),
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-end gap-3 border-t border-border pt-6">
          {erreurSoumission && <p className="text-sm text-danger">{erreurSoumission}</p>}
          <button
            type="button"
            onClick={soumettre}
            disabled={pendingSoumission}
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {pendingSoumission ? "Soumission…" : "Soumettre l'évaluation"}
          </button>
        </div>
      </div>
    </div>
  );
}
