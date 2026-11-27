"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, SelectField } from "@/components/ui/field";
import { IconPlus } from "@/components/icons";
import { formaterDate } from "@/lib/format";
import {
  creerEvaluationExterneAction,
  lierEvaluationExterneAction,
  supprimerEvaluationExterneAction,
} from "@/lib/verification-actions";
import type { EvaluationExterne, Organisation } from "@/lib/types";

const SOURCES = { ARS: "ARS", MINISTERE: "Ministère de la Santé" } as const;

function Bouton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
      {pending ? "Enregistrement…" : "Enregistrer l'évaluation"}
    </button>
  );
}

export function EvaluationsExternesAdmin({ evaluations, organisations }: { evaluations: EvaluationExterne[]; organisations: Organisation[] }) {
  const [creation, setCreation] = useState(false);
  const [aSupprimer, setASupprimer] = useState<EvaluationExterne | null>(null);
  const [erreur, setErreur] = useState<string>();
  const [, demarrer] = useTransition();

  return (
    <div>
      <div className="flex justify-end">
        <Button onClick={() => setCreation(true)} className="h-9 gap-1.5 px-3.5">
          <IconPlus width={16} height={16} />
          Nouvelle évaluation
        </Button>
      </div>
      {erreur && <p className="mt-3 text-sm text-danger">{erreur}</p>}

      {evaluations.length === 0 ? (
        <p className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-6 py-10 text-center text-sm text-text-muted">
          Aucune évaluation enregistrée.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle text-left text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="px-4 py-3">Établissement</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Niveau</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Compte DSP</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {evaluations.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{e.nomEtablissement}</p>
                    <p className="text-xs text-text-faint">
                      {e.typeEtablissement}
                      {e.ville ? ` · ${e.ville}` : ""}
                      {e.ifu ? ` · IFU ${e.ifu}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{SOURCES[e.source]}</td>
                  <td className="px-4 py-3 font-display font-bold text-primary">{e.niveau}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">{formaterDate(e.dateEvaluation)}</td>
                  <td className="px-4 py-3">
                    <select
                      aria-label="Compte DSP rattaché"
                      defaultValue={e.organisationId ?? ""}
                      onChange={(ev) =>
                        demarrer(async () => {
                          const r = await lierEvaluationExterneAction(e.id, ev.target.value || null);
                          setErreur(r.erreur);
                        })
                      }
                      className="max-w-[14rem] rounded-[var(--radius-md)] border border-border bg-surface px-2 py-1.5 text-sm"
                    >
                      <option value="">Non inscrit</option>
                      {organisations.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nom}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <a href={e.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {e.documentNom}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setASupprimer(e)} className="text-sm font-medium text-danger hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creation} onClose={() => setCreation(false)} title="Nouvelle évaluation ARS / Ministère" largeur="large">
        <FormulaireEvaluation organisations={organisations} onSuccess={() => setCreation(false)} />
      </Modal>
      <ConfirmDialog
        open={aSupprimer !== null}
        onClose={() => setASupprimer(null)}
        onConfirm={async () => {
          if (!aSupprimer) return;
          const r = await supprimerEvaluationExterneAction(aSupprimer.id);
          setErreur(r.erreur);
        }}
        titre="Supprimer cette évaluation ?"
        description="Elle ne sera plus publiée et son document sera supprimé."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function FormulaireEvaluation({ organisations, onSuccess }: { organisations: Organisation[]; onSuccess: () => void }) {
  const [etat, formAction] = useActionState(creerEvaluationExterneAction, {});
  useEffect(() => {
    if (etat.succes) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat]);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom de l'établissement" name="nomEtablissement" required minLength={2} />
        <SelectField label="Type" name="typeEtablissement" required defaultValue="EH">
          <option value="EH">EH</option>
          <option value="ESPC">ESPC</option>
        </SelectField>
        <Field label="Ville" name="ville" />
        <Field label="IFU" name="ifu" placeholder="Rattachement automatique à l'inscription" />
        <SelectField label="Source" name="source" required defaultValue="ARS">
          <option value="ARS">{SOURCES.ARS}</option>
          <option value="MINISTERE">{SOURCES.MINISTERE}</option>
        </SelectField>
        <SelectField label="Niveau obtenu (0 à 5)" name="niveau" required defaultValue="">
          <option value="" disabled>
            Choisir
          </option>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              Niveau {n}
            </option>
          ))}
        </SelectField>
        <Field label="Date de l'évaluation" name="dateEvaluation" type="date" required />
        <Field label="Référence du rapport" name="reference" placeholder="Facultatif" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="% essentiels" name="pctEssentiels" type="number" min={0} max={100} step={0.1} placeholder="Facultatif" />
        <Field label="% fondamentaux" name="pctFondamentaux" type="number" min={0} max={100} step={0.1} placeholder="Facultatif" />
        <Field label="% avancés" name="pctAvances" type="number" min={0} max={100} step={0.1} placeholder="Facultatif" />
      </div>
      <SelectField label="Compte DSP (déjà inscrit)" name="organisationId" defaultValue="">
        <option value="">Aucun / par IFU</option>
        {organisations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nom}
          </option>
        ))}
      </SelectField>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
        Document officiel (PDF ou image, 4 Mo au plus)
        <input type="file" name="document" required accept="application/pdf,image/jpeg,image/png,image/webp" className="text-sm font-normal text-text-muted" />
      </label>
      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <div>
        <Bouton />
      </div>
    </form>
  );
}
