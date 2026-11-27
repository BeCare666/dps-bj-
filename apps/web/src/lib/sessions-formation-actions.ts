"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "./api-server";
import { messageErreurApi } from "./api-error";
import type { EtatAction } from "./types";

// §4.1, §4.5 — sessions en ligne (administration DSP).

const texte = (formData: FormData, cle: string) => String(formData.get(cle) ?? "").trim();
// datetime-local saisi à l'heure du Bénin (UTC+1, sans heure d'été).
const versIso = (local: string) => (local ? new Date(`${local}:00+01:00`).toISOString() : undefined);

async function envoyer(chemin: string, init: RequestInit, erreurParDefaut: string, revalider: string[]): Promise<EtatAction> {
  const res = await apiFetch(chemin, init);
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, erreurParDefaut) };
  }
  for (const p of revalider) revalidatePath(p);
  return { succes: true };
}

export async function creerSessionAction(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  const places = texte(formData, "placesMax");
  return envoyer(
    "/sessions-formation",
    {
      method: "POST",
      body: JSON.stringify({
        formationId: texte(formData, "formationId"),
        debut: versIso(texte(formData, "debut")),
        fin: versIso(texte(formData, "fin")),
        lienMeet: texte(formData, "lienMeet"),
        codeMeet: texte(formData, "codeMeet") || undefined,
        placesMax: places ? Number(places) : undefined,
      }),
    },
    "Impossible de créer la session.",
    ["/admin/sessions-formation"],
  );
}

export async function modifierSessionAction(sessionId: string, _etat: EtatAction, formData: FormData): Promise<EtatAction> {
  const places = texte(formData, "placesMax");
  return envoyer(
    `/sessions-formation/${sessionId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        debut: versIso(texte(formData, "debut")),
        fin: versIso(texte(formData, "fin")),
        lienMeet: texte(formData, "lienMeet"),
        codeMeet: texte(formData, "codeMeet") || null,
        placesMax: places ? Number(places) : null,
      }),
    },
    "Impossible de modifier la session.",
    ["/admin/sessions-formation", `/admin/sessions-formation/${sessionId}`],
  );
}

export async function annulerSessionAction(sessionId: string): Promise<EtatAction> {
  return envoyer(`/sessions-formation/${sessionId}/annuler`, { method: "POST" }, "Impossible d'annuler la session.", [
    "/admin/sessions-formation",
    `/admin/sessions-formation/${sessionId}`,
  ]);
}

export async function enregistrerPresencesAction(sessionId: string, presences: { participantId: string; present: boolean }[]): Promise<EtatAction> {
  return envoyer(
    `/sessions-formation/${sessionId}/presences`,
    { method: "PUT", body: JSON.stringify({ presences }) },
    "Impossible d'enregistrer les présences.",
    [`/admin/sessions-formation/${sessionId}`],
  );
}

export async function cloturerSessionAction(sessionId: string): Promise<EtatAction> {
  return envoyer(`/sessions-formation/${sessionId}/cloturer`, { method: "POST" }, "Impossible de clôturer la session.", [
    "/admin/sessions-formation",
    `/admin/sessions-formation/${sessionId}`,
    "/admin/reservations",
  ]);
}
