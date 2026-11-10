import type { Metadata } from "next";
import { apiFetchJson } from "@/lib/api-server";
import { libelleDepartement, LIBELLES_NIVEAU_AUTORITE } from "@/lib/rapports-statistiques-libelles";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { ressortAutorite } from "@/components/autorite/elements";
import type { AutoriteSanitaire, UtilisateurProfil } from "@/lib/types";

export const metadata: Metadata = {
  title: "Mon autorité",
  robots: { index: false, follow: false },
};

function Info({ libelle, valeur }: { libelle: string; valeur: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-faint">{libelle}</dt>
      <dd className="mt-0.5 break-words text-sm text-text">{valeur || "—"}</dd>
    </div>
  );
}

// ROADMAP_ESPACE_AUTORITES.md, étape 4.1 — autorité du compte et règles de visibilité.
export default async function CompteAutoritePage() {
  const [autorite, profil] = await Promise.all([
    apiFetchJson<AutoriteSanitaire>("/autorite/me"),
    apiFetchJson<UtilisateurProfil>("/auth/me/profil"),
  ]);
  const zone = autorite.niveau === "ZONE_SANITAIRE";

  return (
    <>
      <PageHeader surtitre="Compte" titre="Mon autorité" description="Autorité sanitaire rattachée à votre compte et données auxquelles vous avez accès." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader titre="Autorité" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Info libelle="Nom" valeur={autorite.nom} />
            <Info libelle="Niveau" valeur={LIBELLES_NIVEAU_AUTORITE[autorite.niveau]} />
            <Info libelle="Département" valeur={autorite.departement ? libelleDepartement(autorite.departement) : "Tous"} />
            <Info libelle="Zone sanitaire" valeur={autorite.zoneSanitaire ?? (autorite.niveau === "ZONE_SANITAIRE" ? null : "Toutes")} />
          </dl>
        </Card>
        <Card>
          <CardHeader titre="Utilisateur" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Info libelle="Nom" valeur={`${profil.prenom} ${profil.nom}`} />
            <Info libelle="Email" valeur={profil.email} />
          </dl>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader titre="Ce que vous voyez" />
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-text-muted">
          <li>Les rapports statistiques <strong className="text-text">soumis ou validés</strong> par les établissements de votre ressort : {ressortAutorite(autorite)}. Un brouillon n&apos;est jamais visible.</li>
          <li>La liste des établissements de la plateforme localisés dans ce ressort (fiche « Mon établissement ») et leurs coordonnées.</li>
          <li>
            {zone
              ? "Vous validez les rapports reçus ; votre première consultation d'un rapport enregistre sa date de réception."
              : "La validation des rapports est faite par la zone sanitaire destinataire ; vous les consultez."}
          </li>
          <li>Aucune autre donnée des établissements (auto-évaluation, NEWS, événements indésirables, formations) n&apos;est accessible depuis cet espace.</li>
        </ul>
      </Card>
    </>
  );
}
