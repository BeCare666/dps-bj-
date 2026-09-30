"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "./api-server";
import { messageErreurApi } from "./api-error";

export interface EtatAction {
  erreur?: string;
  succes?: boolean;
}

export async function modifierMonOrganisationAction(_etat: EtatAction, formData: FormData): Promise<EtatAction> {
  const nom = String(formData.get("nom") ?? "").trim();
  const adresse = String(formData.get("adresse") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  const res = await apiFetch("/organisations/me", {
    method: "PATCH",
    body: JSON.stringify({ nom, adresse, telephone, email }),
  });
  if (!res.ok) {
    const corps = await res.json().catch(() => undefined);
    return { erreur: messageErreurApi(corps, "Impossible de modifier les coordonnées de l'établissement.") };
  }
  revalidatePath("/organisation");
  return { succes: true };
}
