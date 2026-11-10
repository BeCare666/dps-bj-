import type { Metadata } from "next";
import { bornesPeriode, formulaireStatistique } from "@dps/shared";
import { apiFetchJson, silencieux } from "@/lib/api-server";
import { contexteAutorite, optionsEtablissements } from "@/lib/autorite-serveur";
import { LIBELLES_STRUCTURE, resumeFiltres, type ParametresUrl } from "@/lib/autorite-filtres";
import { LIBELLES_STATUT_RAPPORT, libellePeriodeRapport, titreFormulaire } from "@/lib/rapports-statistiques-libelles";
import { PageHeader } from "@/components/ui/page-header";
import { FiltresBarre } from "@/components/autorite/filtres-barre";
import { TableauDonnees, type LigneDonnees } from "@/components/autorite/tableau-donnees";
import { ressortAutorite, surtitreAutorite } from "@/components/autorite/elements";
import type { RapportStatistiqueResume } from "@/lib/types";

export const metadata: Metadata = {
  title: "Rapports reçus",
  robots: { index: false, follow: false },
};

// ROADMAP_ESPACE_AUTORITES.md, étape 5.2 — liste complète, filtres communs
// (période, établissements, communes, type de structure, statut) puis
// recherche, facettes, tri et export dans le tableau.
export default async function AutoriteRapportsPage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const { autorite, etablissements, filtres, noms } = await contexteAutorite(searchParams, "tout");
  const rapports = await silencieux(
    apiFetchJson<RapportStatistiqueResume[]>(`/autorite/rapports${filtres.statut ? `?statut=${filtres.statut}` : ""}`),
    [],
  );
  const parId = new Map(etablissements.map((e) => [e.id, e]));

  const lignes: LigneDonnees[] = rapports
    .filter((r) => {
      const e = parId.get(r.organisation.id);
      const def = formulaireStatistique(r.formulaireCode);
      const debut = def ? bornesPeriode(def.periodicite, r.periode)?.debut.toISOString().slice(0, 10) : undefined;
      return (
        (!filtres.du || (debut !== undefined && debut >= filtres.du)) &&
        (!filtres.au || (debut !== undefined && debut <= filtres.au)) &&
        (filtres.etablissements.length === 0 || filtres.etablissements.includes(r.organisation.id)) &&
        (filtres.communes.length === 0 || (e?.commune != null && filtres.communes.includes(e.commune))) &&
        (filtres.structures.length === 0 || (e?.typeStructure != null && filtres.structures.includes(e.typeStructure)))
      );
    })
    .map((r) => {
      const e = parId.get(r.organisation.id);
      const def = formulaireStatistique(r.formulaireCode);
      return {
        id: r.id,
        lien: `/autorite/rapports/${r.id}`,
        etablissement: r.organisation.nom,
        formulaire: titreFormulaire(r.formulaireCode),
        periode: libellePeriodeRapport(r.formulaireCode, r.periode),
        debut: def ? (bornesPeriode(def.periodicite, r.periode)?.debut.toISOString() ?? r.periode) : r.periode,
        commune: e?.commune ?? (r.entete.commune || null),
        structure: e?.typeStructure ? (LIBELLES_STRUCTURE[e.typeStructure] ?? e.typeStructure) : null,
        statut: LIBELLES_STATUT_RAPPORT[r.statut],
        soumisLe: r.soumisLe,
        recuLe: r.recuLe,
        valideLe: r.valideLe,
        validePar: r.validePar ? `${r.validePar.prenom} ${r.validePar.nom}` : null,
      };
    });

  return (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Rapports reçus"
        description={`Rapports statistiques soumis par les établissements de votre ressort : ${ressortAutorite(autorite)}.`}
      />
      <FiltresBarre etablissements={optionsEtablissements(etablissements)} raccourciParDefaut="tout" />
      <TableauDonnees
        id="autorite-rapports"
        recherche="Rechercher un établissement, un formulaire…"
        nomExport={`rapports-recus${resumeFiltres(filtres, noms) ? "-filtres" : ""}`}
        lienLigne="lien"
        tailleDePage={25}
        triParDefaut={{ cle: "soumisLe", direction: "desc" }}
        vide={{ titre: "Aucun rapport reçu", description: "Les rapports apparaissent ici dès qu'un établissement de votre ressort les soumet." }}
        colonnes={[
          { cle: "etablissement", entete: "Établissement", lien: "lien" },
          { cle: "formulaire", entete: "Formulaire", filtre: true },
          { cle: "periode", entete: "Période", tri: "debut" },
          { cle: "commune", entete: "Commune", filtre: true },
          { cle: "structure", entete: "Type de structure", filtre: true, masqueeParDefaut: true },
          { cle: "statut", entete: "Statut", filtre: true },
          { cle: "soumisLe", entete: "Soumis le", format: "date" },
          { cle: "recuLe", entete: "Reçu le", format: "date", masqueeParDefaut: true },
          { cle: "valideLe", entete: "Validé le", format: "date" },
          { cle: "validePar", entete: "Validé par", masqueeParDefaut: true },
        ]}
        lignes={lignes}
      />
    </>
  );
}
