"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "./api-server";
import { messageErreurApi } from "./api-error";
import type { EtatAction } from "./types";

// §5.3 — évaluations ARS / Ministère enregistrées par DSP (multipart avec le
// document justificatif).
const CHAMPS = [
  "nomEtablissement",
  "typeEtablissement",
  "ville",
  "ifu",
  "source",
  "niveau",
  "dateEvaluation",
  "pctEssentiels",
  "pctFondamentaux",
  "pctAvances",
  "reference",
  "organisationId",
] as const;

export async function creerEvaluationExterneAction(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  const document = formData.get("document");
  if (!(document instanceof File) || document.size === 0) return { erreur: "Joignez le document officiel de l'évaluation." };
  const corps = new FormData();
  for (const champ of CHAMPS) {
    const v = String(formData.get(champ) ?? "").trim();
    if (v) corps.append(champ, champ.startsWith("pct") ? v.replace(",", ".") : v);
  }
  corps.append("document", document);
  const res = await apiFetch("/evaluations-externes", { method: "POST", body: corps });
  if (!res.ok) {
    const erreur = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(erreur, "Impossible d'enregistrer l'évaluation.") };
  }
  revalidatePath("/admin/evaluations-externes");
  return { succes: true };
}

export async function lierEvaluationExterneAction(id: string, organisationId: string | null): Promise<EtatAction> {
  const res = await apiFetch(`/evaluations-externes/${id}/organisation`, {
    method: "PATCH",
    body: JSON.stringify({ organisationId }),
  });
  if (!res.ok) {
    const erreur = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(erreur, "Impossible de modifier le rattachement.") };
  }
  revalidatePath("/admin/evaluations-externes");
  return { succes: true };
}

export async function supprimerEvaluationExterneAction(id: string): Promise<EtatAction> {
  const res = await apiFetch(`/evaluations-externes/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const erreur = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(erreur, "Impossible de supprimer l'évaluation.") };
  }
  revalidatePath("/admin/evaluations-externes");
  return { succes: true };
}
