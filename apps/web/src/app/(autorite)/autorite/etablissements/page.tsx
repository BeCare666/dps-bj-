import type { Metadata } from "next";
import { contexteAutorite } from "@/lib/autorite-serveur";
import { LIBELLES_STRUCTURE, type ParametresUrl } from "@/lib/autorite-filtres";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { GraphiqueAnneau, GraphiqueBarres } from "@/components/autorite/graphiques";
import { TableauDonnees, type LigneDonnees } from "@/components/autorite/tableau-donnees";
import { ressortAutorite, surtitreAutorite } from "@/components/autorite/elements";
import { IconHospital, IconInbox, IconRoute } from "@/components/icons";

export const metadata: Metadata = {
  title: "Établissements",
  robots: { index: false, follow: false },
};

// ROADMAP_ESPACE_AUTORITES.md, étape 5.4.
export default async function EtablissementsPage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const { autorite, etablissements } = await contexteAutorite(searchParams);
  const localises = etablissements.filter((e) => e.localiseDansRessort);
  const ayantTransmis = etablissements.filter((e) => e.rapports.total > 0);

  const parCommune = new Map<string, number>();
  for (const e of localises) parCommune.set(e.commune ?? "Non renseignée", (parCommune.get(e.commune ?? "Non renseignée") ?? 0) + 1);
  const parStructure = new Map<string, number>();
  for (const e of localises) {
    const s = e.typeStructure ? (LIBELLES_STRUCTURE[e.typeStructure] ?? e.typeStructure) : "Non renseigné";
    parStructure.set(s, (parStructure.get(s) ?? 0) + 1);
  }

  const lignes: LigneDonnees[] = etablissements.map((e) => ({
    id: e.id,
    lien: `/autorite/etablissements/${e.id}`,
    nom: e.nom,
    commune: e.commune,
    arrondissement: e.arrondissement,
    zone: e.zoneSanitaire,
    categorie: e.type,
    structure: e.typeStructure ? (LIBELLES_STRUCTURE[e.typeStructure] ?? e.typeStructure) : null,
    total: e.rapports.total,
    aValider: e.rapports.soumis,
    valides: e.rapports.valides,
    formulaires: e.formulaires.length,
    derniere: e.derniereSoumission,
    localise: e.localiseDansRessort ? "Oui" : "Non",
    telephone: e.telephone,
    email: e.email,
  }));

  return (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Établissements"
        description={`Établissements de la plateforme localisés dans votre ressort (${ressortAutorite(autorite)}), et ceux qui y ont transmis un rapport.`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Localisés dans le ressort" valeur={`${localises.length}`} sousTexte="Selon la fiche « Mon établissement »" icone={IconHospital} />
        <StatCard label="Ayant transmis" valeur={`${ayantTransmis.length}`} sousTexte="Au moins un rapport soumis" icone={IconInbox} ton="success" />
        <StatCard
          label="Localisés ailleurs"
          valeur={`${etablissements.length - localises.length}`}
          sousTexte="Ont transmis dans le ressort, fiche localisée ailleurs"
          icone={IconRoute}
          ton="neutral"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader titre="Par commune" description="Établissements localisés dans le ressort" />
          <GraphiqueBarres
            donnees={[...parCommune.entries()].sort((a, b) => b[1] - a[1]).map(([commune, n]) => ({ commune, n }))}
            cleX="commune"
            horizontal
            series={[{ cle: "n", label: "Établissements" }]}
          />
        </Card>
        <Card>
          <CardHeader titre="Par type de structure" description="Établissements localisés dans le ressort" />
          <GraphiqueAnneau donnees={[...parStructure.entries()].map(([label, valeur]) => ({ label, valeur }))} unite="établissements" />
        </Card>
      </div>

      <div className="mt-6">
        <TableauDonnees
          id="autorite-etablissements"
          recherche="Rechercher un établissement, une commune…"
          nomExport="etablissements"
          lienLigne="lien"
          tailleDePage={25}
          colonnes={[
            { cle: "nom", entete: "Établissement", lien: "lien" },
            { cle: "commune", entete: "Commune", filtre: true },
            { cle: "arrondissement", entete: "Arrondissement", masqueeParDefaut: true },
            { cle: "zone", entete: "Zone sanitaire", masqueeParDefaut: true },
            { cle: "categorie", entete: "Catégorie ARS", filtre: true, masqueeParDefaut: true },
            { cle: "structure", entete: "Type de structure", filtre: true },
            { cle: "total", entete: "Rapports", format: "nombre" },
            { cle: "aValider", entete: "À valider", format: "nombre" },
            { cle: "valides", entete: "Validés", format: "nombre" },
            { cle: "formulaires", entete: "Formulaires transmis", format: "nombre", masqueeParDefaut: true },
            { cle: "derniere", entete: "Dernière soumission", format: "date" },
            { cle: "localise", entete: "Localisé dans le ressort", filtre: true, masqueeParDefaut: true },
            { cle: "telephone", entete: "Téléphone", masqueeParDefaut: true },
            { cle: "email", entete: "Email", masqueeParDefaut: true },
          ]}
          lignes={lignes}
          vide={{ titre: "Aucun établissement", description: "Aucun établissement de la plateforme n'est localisé dans votre ressort." }}
        />
      </div>
    </>
  );
}
