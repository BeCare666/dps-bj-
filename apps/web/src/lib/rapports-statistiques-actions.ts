"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch } from "./api-server";
import { messageErreurApi } from "./api-error";

export interface EtatRapport {
  erreur?: string;
  succes?: boolean;
}

export async function creerRapportAction(_etat: EtatRapport, formData: FormData): Promise<EtatRapport> {
  const formulaireCode = String(formData.get("formulaireCode") ?? "");
  const periode = String(formData.get("periode") ?? "");
  if (!formulaireCode || !periode) return { erreur: "Choisissez un formulaire et une période." };

  const res = await apiFetch("/rapports-statistiques", {
    method: "POST",
    body: JSON.stringify({ formulaireCode, periode }),
  });
  const corps = await res.json().catch(() => undefined);
  if (!res.ok) return { erreur: messageErreurApi(corps, "Impossible de créer le rapport.") };

  revalidatePath("/rapports-statistiques");
  redirect(`/rapports-statistiques/${(corps as { id: string }).id}`);
}

export async function enregistrerRapportAction(
  id: string,
  modifications: { entete?: Record<string, string>; valeurs?: Record<string, unknown> },
): Promise<EtatRapport> {
  const res = await apiFetch(`/rapports-statistiques/${id}`, { method: "PATCH", body: JSON.stringify(modifications) });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible d'enregistrer le rapport.") };
  }
  revalidatePath(`/rapports-statistiques/${id}`);
  return { succes: true };
}

export async function soumettreRapportAction(id: string): Promise<EtatRapport> {
  const res = await apiFetch(`/rapports-statistiques/${id}/soumettre`, { method: "POST" });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible de soumettre le rapport.") };
  }
  revalidatePath("/rapports-statistiques");
  revalidatePath(`/rapports-statistiques/${id}`);
  return { succes: true };
}

export async function validerRapportAction(id: string): Promise<EtatRapport> {
  const res = await apiFetch(`/autorite/rapports/${id}/valider`, { method: "POST" });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible de valider le rapport.") };
  }
  revalidatePath("/autorite");
  revalidatePath(`/autorite/rapports/${id}`);
  return { succes: true };
}
