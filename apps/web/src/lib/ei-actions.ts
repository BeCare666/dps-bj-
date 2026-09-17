"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchJson, ApiError } from "./api-server";
import { messageErreurApi } from "./api-error";
import type { EvenementIndesirable } from "./types";

export interface EtatAction {
  erreur?: string;
}

function valeur(formData: FormData, champ: string): string {
  return String(formData.get(champ) ?? "").trim();
}

function valeurOptionnelle(formData: FormData, champ: string): string | undefined {
  const v = valeur(formData, champ);
  return v.length > 0 ? v : undefined;
}

export async function declarerEiAction(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  let evenement: EvenementIndesirable;
  try {
    evenement = await apiFetchJson<EvenementIndesirable>("/evenements-indesirables", {
      method: "POST",
      body: JSON.stringify({
        description: valeur(formData, "description"),
        typeEiId: valeurOptionnelle(formData, "typeEiId"),
        serviceId: valeurOptionnelle(formData, "serviceId"),
      }),
    });
  } catch (erreur) {
    if (erreur instanceof ApiError) {
      return { erreur: messageErreurApi(erreur.body, "Impossible de déclarer l'événement.") };
    }
    throw erreur;
  }
  redirect(`/evenements-indesirables/${evenement.id}`);
}

export async function qualifierEiAction(eiId: string, gravite: string): Promise<EtatAction> {
  const res = await apiFetch(`/evenements-indesirables/${eiId}/qualifier`, {
    method: "PATCH",
    body: JSON.stringify({ gravite }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible de qualifier l'événement.") };
  }
  revalidatePath(`/evenements-indesirables/${eiId}`);
  return {};
}

export async function ajouterCauseAction(eiId: string, _etat: EtatAction, formData: FormData): Promise<EtatAction> {
  const res = await apiFetch(`/evenements-indesirables/${eiId}/causes`, {
    method: "POST",
    body: JSON.stringify({
      type: valeur(formData, "type"),
      description: valeur(formData, "description"),
    }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible d'ajouter la cause.") };
  }
  revalidatePath(`/evenements-indesirables/${eiId}`);
  return {};
}

export async function ajouterActionCorrectiveAction(
  eiId: string,
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const res = await apiFetch(`/evenements-indesirables/${eiId}/actions-correctives`, {
    method: "POST",
    body: JSON.stringify({
      description: valeur(formData, "description"),
      responsableId: valeur(formData, "responsableId"),
      echeance: valeur(formData, "echeance"),
    }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible d'ajouter l'action corrective.") };
  }
  revalidatePath(`/evenements-indesirables/${eiId}`);
  return {};
}

export async function changerStatutActionAction(eiId: string, actionId: string, statut: string): Promise<EtatAction> {
  const res = await apiFetch(`/evenements-indesirables/${eiId}/actions-correctives/${actionId}`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Transition refusée.") };
  }
  revalidatePath(`/evenements-indesirables/${eiId}`);
  return {};
}

export async function changerStatutEiAction(eiId: string, statut: string): Promise<EtatAction> {
  const res = await apiFetch(`/evenements-indesirables/${eiId}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Transition de statut refusée.") };
  }
  revalidatePath(`/evenements-indesirables/${eiId}`);
  return {};
}

export async function uploaderPieceJointeAction(
  eiId: string,
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const fichier = formData.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { erreur: "Sélectionnez un fichier avant d'envoyer." };
  }

  const corpsMultipart = new FormData();
  corpsMultipart.set("fichier", fichier);

  const res = await apiFetch(`/evenements-indesirables/${eiId}/pieces-jointes`, {
    method: "POST",
    body: corpsMultipart,
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible d'envoyer la pièce jointe.") };
  }
  revalidatePath(`/evenements-indesirables/${eiId}`);
  return {};
}
