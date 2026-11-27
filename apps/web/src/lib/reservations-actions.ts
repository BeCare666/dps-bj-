"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchJson, ApiError } from "./api-server";
import { messageErreurApi } from "./api-error";
import type { Reservation } from "./types";

export interface EtatAction {
  erreur?: string;
}

export async function creerReservationAction(
  formationId: string,
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  let reservation: Reservation;
  try {
    reservation = await apiFetchJson<Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify({
        formationId,
        formule: String(formData.get("formule") ?? ""),
        sessionFormationId: String(formData.get("sessionFormationId") ?? "") || undefined,
      }),
    });
  } catch (erreur) {
    if (erreur instanceof ApiError) {
      return { erreur: messageErreurApi(erreur.body, "Impossible de créer la réservation.") };
    }
    throw erreur;
  }
  redirect(`/mes-reservations/${reservation.id}`);
}

export async function verifierPaiementAction(reservationId: string, transactionId: string): Promise<EtatAction> {
  const res = await apiFetch(`/reservations/${reservationId}/paiement/verifier`, {
    method: "POST",
    body: JSON.stringify({ transactionId }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "La vérification du paiement a échoué.") };
  }
  revalidatePath(`/mes-reservations/${reservationId}`);
  return {};
}

export async function annulerReservationAction(reservationId: string): Promise<EtatAction> {
  const res = await apiFetch(`/reservations/${reservationId}/annuler`, { method: "POST" });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible d'annuler la réservation.") };
  }
  revalidatePath(`/mes-reservations/${reservationId}`);
  return {};
}

// §4.3 — participants inscrits par l'établissement.
export async function ajouterParticipantAction(
  reservationId: string,
  _etat: EtatAction & { succes?: boolean },
  formData: FormData,
): Promise<EtatAction & { succes?: boolean }> {
  const texte = (cle: string) => String(formData.get(cle) ?? "").trim();
  const res = await apiFetch(`/reservations/${reservationId}/participants`, {
    method: "POST",
    body: JSON.stringify({
      nom: texte("nom"),
      prenom: texte("prenom"),
      fonction: texte("fonction"),
      service: texte("service") || undefined,
      email: texte("email"),
      telephone: texte("telephone") || undefined,
    }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible d'ajouter ce participant.") };
  }
  revalidatePath(`/mes-reservations/${reservationId}`);
  return { succes: true };
}

export async function retirerParticipantAction(reservationId: string, participantId: string): Promise<EtatAction> {
  const res = await apiFetch(`/reservations/${reservationId}/participants/${participantId}`, { method: "DELETE" });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible de retirer ce participant.") };
  }
  revalidatePath(`/mes-reservations/${reservationId}`);
  return {};
}
