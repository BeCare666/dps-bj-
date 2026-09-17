"use server";

import { redirect } from "next/navigation";
import { API_URL, apiFetch } from "./api-server";
import { synchroniserCookiesSession, effacerCookiesSession } from "./session-cookies";
import { messageErreurApi } from "./api-error";

export interface EtatFormulaire {
  erreur?: string;
}

function valeur(formData: FormData, champ: string): string {
  return String(formData.get(champ) ?? "").trim();
}

function valeurOptionnelle(formData: FormData, champ: string): string | undefined {
  const v = valeur(formData, champ);
  return v.length > 0 ? v : undefined;
}

async function appelerApiPublic(path: string, payload: unknown): Promise<{ res: Response; corps: unknown }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const corps = await res.json().catch(() => undefined);
  return { res, corps };
}

export async function inscrireOrganisationAction(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const payload = {
    organisationNom: valeur(formData, "organisationNom"),
    organisationIfu: valeur(formData, "organisationIfu"),
    organisationType: valeur(formData, "organisationType"),
    organisationAdresse: valeurOptionnelle(formData, "organisationAdresse"),
    organisationTelephone: valeurOptionnelle(formData, "organisationTelephone"),
    organisationEmail: valeurOptionnelle(formData, "organisationEmail"),
    responsableNom: valeur(formData, "responsableNom"),
    responsablePrenom: valeur(formData, "responsablePrenom"),
    responsableEmail: valeur(formData, "responsableEmail"),
    responsableTelephone: valeurOptionnelle(formData, "responsableTelephone"),
    motDePasse: valeur(formData, "motDePasse"),
  };

  const { res, corps } = await appelerApiPublic("/auth/register/organisation", payload);
  if (!res.ok) {
    return { erreur: messageErreurApi(corps) };
  }

  redirect(`/verification-email?email=${encodeURIComponent(payload.responsableEmail)}`);
}

export async function inscrireIndividuelAction(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const payload = {
    nom: valeur(formData, "nom"),
    prenom: valeur(formData, "prenom"),
    email: valeur(formData, "email"),
    telephone: valeurOptionnelle(formData, "telephone"),
    motDePasse: valeur(formData, "motDePasse"),
  };

  const { res, corps } = await appelerApiPublic("/auth/register/individuel", payload);
  if (!res.ok) {
    return { erreur: messageErreurApi(corps) };
  }

  redirect(`/verification-email?email=${encodeURIComponent(payload.email)}`);
}

export async function connexionAction(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const payload = {
    email: valeur(formData, "email"),
    motDePasse: valeur(formData, "motDePasse"),
  };

  const { res, corps } = await appelerApiPublic("/auth/login", payload);
  if (!res.ok) {
    return { erreur: messageErreurApi(corps, "Identifiants invalides.") };
  }

  await synchroniserCookiesSession(res);
  redirect("/tableau-de-bord");
}

export async function renvoyerVerificationAction(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await appelerApiPublic("/auth/resend-verification", { email: valeur(formData, "email") });
  return { erreur: undefined };
}

export interface EtatDemandeReinitialisation extends EtatFormulaire {
  envoye?: boolean;
}

export async function demanderReinitialisationAction(
  _etat: EtatDemandeReinitialisation,
  formData: FormData,
): Promise<EtatDemandeReinitialisation> {
  await appelerApiPublic("/auth/forgot-password", { email: valeur(formData, "email") });
  return { envoye: true };
}

export async function reinitialiserMotDePasseAction(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const payload = {
    token: valeur(formData, "token"),
    nouveauMotDePasse: valeur(formData, "nouveauMotDePasse"),
  };

  const { res, corps } = await appelerApiPublic("/auth/reset-password", payload);
  if (!res.ok) {
    return { erreur: messageErreurApi(corps, "Lien invalide ou expiré.") };
  }

  redirect("/login?reset=true");
}

export async function deconnexionAction(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
  await effacerCookiesSession();
  redirect("/login");
}
