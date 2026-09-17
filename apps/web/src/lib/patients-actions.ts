"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchJson, ApiError } from "./api-server";
import { messageErreurApi } from "./api-error";
import type { Patient } from "./types";

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

export async function creerPatientAction(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  let patient: Patient;
  try {
    patient = await apiFetchJson<Patient>("/patients", {
      method: "POST",
      body: JSON.stringify({
        nom: valeur(formData, "nom"),
        prenom: valeur(formData, "prenom"),
        dateNaissance: valeurOptionnelle(formData, "dateNaissance"),
        sexe: valeurOptionnelle(formData, "sexe"),
        numeroDossier: valeurOptionnelle(formData, "numeroDossier"),
      }),
    });
  } catch (erreur) {
    if (erreur instanceof ApiError) {
      return { erreur: messageErreurApi(erreur.body, "Impossible de créer la fiche patient.") };
    }
    throw erreur;
  }
  redirect(`/news/${patient.id}`);
}

export async function cloturerPatientAction(patientId: string): Promise<EtatAction> {
  const res = await apiFetch(`/patients/${patientId}/cloturer`, { method: "POST" });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible de clôturer la fiche.") };
  }
  revalidatePath(`/news/${patientId}`);
  return {};
}

export async function saisirMesureAction(patientId: string, _etat: EtatAction, formData: FormData): Promise<EtatAction> {
  const payload = {
    frequenceRespiratoire: Number(valeur(formData, "frequenceRespiratoire")),
    saturationOxygene: Number(valeur(formData, "saturationOxygene")),
    oxygenoSupplementation: formData.get("oxygenoSupplementation") === "on",
    temperature: Number(valeur(formData, "temperature")),
    pressionArterielleSystolique: Number(valeur(formData, "pressionArterielleSystolique")),
    frequenceCardiaque: Number(valeur(formData, "frequenceCardiaque")),
    niveauConscience: valeur(formData, "niveauConscience"),
  };

  try {
    await apiFetchJson(`/patients/${patientId}/mesures`, { method: "POST", body: JSON.stringify(payload) });
  } catch (erreur) {
    if (erreur instanceof ApiError) {
      return { erreur: messageErreurApi(erreur.body, "Impossible d'enregistrer la mesure.") };
    }
    throw erreur;
  }
  redirect(`/news/${patientId}`);
}

export async function ajouterInterventionAction(
  alerteId: string,
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const res = await apiFetch(`/alertes/${alerteId}/interventions`, {
    method: "POST",
    body: JSON.stringify({ note: valeur(formData, "note") }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible d'ajouter l'intervention.") };
  }
  revalidatePath(`/news/alertes/${alerteId}`);
  return {};
}

export async function changerStatutAlerteAction(alerteId: string, statut: string): Promise<EtatAction> {
  const res = await apiFetch(`/alertes/${alerteId}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Transition de statut refusée.") };
  }
  revalidatePath(`/news/alertes/${alerteId}`);
  return {};
}
