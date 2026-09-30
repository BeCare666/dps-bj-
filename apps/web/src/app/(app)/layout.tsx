import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { OrgShell } from "@/components/app-shell/org-shell";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { aRole } from "@/lib/session";
import type { Alerte, EvenementIndesirable, Organisation, UtilisateurProfil } from "@/lib/types";
import type { AlerteResume } from "@/components/app-shell/alerts-bell";

async function silencieux<T>(promesse: Promise<T>, repli: T): Promise<T> {
  try {
    return await promesse;
  } catch (erreur) {
    if (erreur instanceof ApiError) return repli;
    throw erreur;
  }
}

function versAlertesNews(alertes: Alerte[]): AlerteResume[] {
  return alertes.map((a) => ({
    id: `news-${a.id}`,
    titre: `Alerte NEWS de niveau ${a.niveauRisque}`,
    sousTitre: a.patient ? `${a.patient.prenom} ${a.patient.nom}` : "Patient",
    lienUrl: `/news/alertes/${a.id}`,
    createdAt: a.createdAt,
  }));
}

function versAlertesEi(evenements: EvenementIndesirable[]): AlerteResume[] {
  // gravite=ELEVEE ne filtre pas par statut côté API (ListEiQueryDto n'a pas
  // de "not equal") — on exclut les EI déjà clôturés côté serveur ici.
  return evenements
    .filter((e) => e.statut !== "CLOTURE")
    .map((e) => ({
      id: `ei-${e.id}`,
      titre: "Événement indésirable de gravité élevée",
      sousTitre: e.typeEi?.libelle ?? "Type non précisé",
      lienUrl: `/evenements-indesirables/${e.id}`,
      createdAt: e.dateDeclaration,
    }));
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const estAdmin = await aRole("ADMIN_PLATEFORME");
  if (estAdmin) redirect("/admin");

  const [organisation, profil] = await Promise.all([
    silencieux(apiFetchJson<Organisation>("/organisations/me"), null),
    apiFetchJson<UtilisateurProfil>("/auth/me/profil"),
  ]);
  const estIndividuel = organisation === null;

  const [alertesNews, evenementsEi] = estIndividuel
    ? [[], []]
    : await Promise.all([
        silencieux(apiFetchJson<Alerte[]>("/alertes?statut=OUVERTE"), []),
        silencieux(apiFetchJson<EvenementIndesirable[]>("/evenements-indesirables?gravite=ELEVEE"), []),
      ]);

  const alertes = [...versAlertesNews(alertesNews), ...versAlertesEi(evenementsEi)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <OrgShell profil={profil} organisationNom={organisation?.nom} estIndividuel={estIndividuel} alertes={alertes}>
      {children}
    </OrgShell>
  );
}
