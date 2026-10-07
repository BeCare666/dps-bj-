import type { Metadata } from "next";
import Link from "next/link";
import { FORMULAIRES_STATISTIQUES } from "@dps/shared";
import { apiFetchJson, silencieux } from "@/lib/api-server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { IconInbox } from "@/components/icons";
import { RapportsTable } from "@/components/rapports-statistiques/rapports-table";
import { LIBELLES_NIVEAU_AUTORITE, libelleDepartement } from "@/lib/rapports-statistiques-libelles";
import type { AutoriteSanitaire, RapportStatistiqueResume, StatutRapportStatistique } from "@/lib/types";

export const metadata: Metadata = {
  title: "Rapports reçus",
  robots: { index: false, follow: false },
};

const FILTRES_STATUT: { valeur?: StatutRapportStatistique; libelle: string }[] = [
  { libelle: "Tous" },
  { valeur: "SOUMIS", libelle: "À valider" },
  { valeur: "VALIDE", libelle: "Validés" },
];

function ressort(a: AutoriteSanitaire): string {
  if (a.niveau === "NATIONAL") return "tous les départements";
  if (a.niveau === "DEPARTEMENT") return `département ${libelleDepartement(a.departement)}`;
  return `zone sanitaire ${a.zoneSanitaire ?? "—"} (${libelleDepartement(a.departement)})`;
}

function lien(statut?: string, formulaire?: string): string {
  const q = new URLSearchParams();
  if (statut) q.set("statut", statut);
  if (formulaire) q.set("formulaire", formulaire);
  const chaine = q.toString();
  return chaine ? `/autorite?${chaine}` : "/autorite";
}

function classeFiltre(actif: boolean): string {
  return `rounded-full border px-3 py-1 text-xs font-medium ${
    actif ? "border-primary bg-primary-soft text-primary" : "border-border text-text-muted hover:text-text"
  }`;
}

export default async function AutoriteRapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; formulaire?: string }>;
}) {
  const { statut, formulaire } = await searchParams;
  const statutFiltre = FILTRES_STATUT.find((f) => f.valeur && f.valeur === statut)?.valeur;
  const formulaireFiltre = FORMULAIRES_STATISTIQUES.find((f) => f.code === formulaire)?.code;

  const query = new URLSearchParams();
  if (statutFiltre) query.set("statut", statutFiltre);
  if (formulaireFiltre) query.set("formulaire", formulaireFiltre);

  const [autorite, rapports] = await Promise.all([
    apiFetchJson<AutoriteSanitaire>("/autorite/me"),
    silencieux(apiFetchJson<RapportStatistiqueResume[]>(`/autorite/rapports?${query.toString()}`), []),
  ]);

  return (
    <>
      <PageHeader
        surtitre={LIBELLES_NIVEAU_AUTORITE[autorite.niveau]}
        titre="Rapports reçus"
        description={`Rapports statistiques soumis par les établissements de votre ressort : ${ressort(autorite)}.`}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTRES_STATUT.map((f) => (
          <Link key={f.libelle} href={lien(f.valeur, formulaireFiltre)} className={classeFiltre(statutFiltre === f.valeur)}>
            {f.libelle}
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={lien(statutFiltre)} className={classeFiltre(!formulaireFiltre)}>
          Tous les formulaires
        </Link>
        {FORMULAIRES_STATISTIQUES.map((f) => (
          <Link key={f.code} href={lien(statutFiltre, f.code)} className={classeFiltre(formulaireFiltre === f.code)}>
            {f.titre}
          </Link>
        ))}
      </div>
      {rapports.length === 0 ? (
        <EmptyState
          icon={<IconInbox className="h-8 w-8" />}
          titre="Aucun rapport reçu"
          description="Les rapports apparaissent ici dès qu'un établissement de votre ressort les soumet."
        />
      ) : (
        <RapportsTable rapports={rapports} lienBase="/autorite/rapports" avecEtablissement />
      )}
    </>
  );
}
