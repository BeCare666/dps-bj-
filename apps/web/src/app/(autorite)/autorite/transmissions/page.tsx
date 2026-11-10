import type { Metadata } from "next";
import { FORMULAIRES_STATISTIQUES, formulaireStatistique } from "@dps/shared";
import { apiFetchJson } from "@/lib/api-server";
import { contexteAutorite, optionsEtablissements } from "@/lib/autorite-serveur";
import { requeteApi, resumeFiltres, type ParametresUrl } from "@/lib/autorite-filtres";
import { formaterPourcentage, libellePeriodeCourt, pourcentage } from "@/lib/autorite-agregats";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { FiltresBarre, SelecteurUrl } from "@/components/autorite/filtres-barre";
import { GraphiqueBarres } from "@/components/autorite/graphiques";
import { MatriceTransmissions } from "@/components/autorite/matrice-transmissions";
import { Formule, surtitreAutorite } from "@/components/autorite/elements";
import { IconCheckCircle, IconGrid, IconHospital, IconInbox } from "@/components/icons";
import { COULEURS } from "@/lib/chart-theme";
import type { TransmissionsAutorite } from "@/lib/types";

export const metadata: Metadata = {
  title: "Suivi des transmissions",
  robots: { index: false, follow: false },
};

// ROADMAP_ESPACE_AUTORITES.md, étape 5.3.
export default async function TransmissionsPage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const brut = await searchParams;
  const code = FORMULAIRES_STATISTIQUES.find((f) => f.code === brut.formulaire)?.code ?? FORMULAIRES_STATISTIQUES[0].code;
  const def = formulaireStatistique(code)!;
  const parDefaut = def.periodicite === "HEBDOMADAIRE" ? "3m" : "12m";
  const { autorite, etablissements, filtres, noms } = await contexteAutorite(Promise.resolve(brut), parDefaut);
  const t = await apiFetchJson<TransmissionsAutorite>(`/autorite/transmissions?${requeteApi({ ...filtres, statut: null }, { formulaire: code })}`);

  const attendues = t.periodes.length * t.etablissements.filter((e) => e.localiseDansRessort).length;
  const recues = t.etablissements.filter((e) => e.localiseDansRessort).reduce((s, e) => s + t.periodes.filter((p) => e.cellules[p]).length, 0);
  const validees = t.parPeriode.reduce((s, p) => s + p.valides, 0);
  const total = t.parPeriode.reduce((s, p) => s + p.transmis, 0);
  const complets = t.etablissements.filter((e) => t.periodes.every((p) => e.cellules[p])).length;

  const graphique = t.parPeriode.map((p) => ({
    libelle: libellePeriodeCourt(p.periode),
    valides: p.valides,
    aValider: p.transmis - p.valides,
    nonRecus: Math.max(0, p.etablissementsLocalises - p.transmis),
  }));

  return (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Suivi des transmissions"
        description="Pour chaque établissement et chaque période : rapport validé, soumis ou non reçu."
      />
      <FiltresBarre etablissements={optionsEtablissements(etablissements)} raccourciParDefaut={parDefaut} avecStatut={false}>
        <SelecteurUrl
          parametre="formulaire"
          libelle="Formulaire"
          valeur={code}
          valeurParDefaut={FORMULAIRES_STATISTIQUES[0].code}
          options={FORMULAIRES_STATISTIQUES.map((f) => ({ valeur: f.code, libelle: f.titre }))}
        />
      </FiltresBarre>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Périodes affichées" valeur={`${t.periodes.length}`} sousTexte={def.periodicite === "MENSUELLE" ? "Mois commencés" : "Semaines ISO commencées"} icone={IconGrid} />
        <StatCard
          label="Rapports reçus"
          valeur={`${total}`}
          sousTexte={`dont ${validees} validé${validees > 1 ? "s" : ""}`}
          icone={IconInbox}
          ton="info"
        />
        <StatCard
          label="Taux de transmission"
          valeur={formaterPourcentage(pourcentage(recues, attendues))}
          sousTexte={<Formule>rapports reçus des établissements localisés ÷ (établissements localisés × périodes) = {recues} ÷ {attendues}</Formule>}
          icone={IconCheckCircle}
          ton="success"
        />
        <StatCard
          label="Établissements complets"
          valeur={`${complets} / ${t.etablissements.length}`}
          sousTexte="Aucune période manquante"
          icone={IconHospital}
          ton="neutral"
        />
      </div>

      <Card className="mt-6">
        <CardHeader titre={`${def.titre} — par période`} description={resumeFiltres(filtres, noms)} />
        <GraphiqueBarres
          donnees={graphique}
          cleX="libelle"
          empile
          series={[
            { cle: "valides", label: "Validés", couleur: COULEURS.success },
            { cle: "aValider", label: "À valider", couleur: COULEURS.warning },
            { cle: "nonRecus", label: "Non reçus (établissements localisés)", couleur: COULEURS.bordure },
          ]}
        />
      </Card>

      <div className="mt-6">
        <MatriceTransmissions donnees={t} />
      </div>
      <p className="mt-4 text-xs text-text-faint">
        Base du taux : établissements de la plateforme localisés dans votre ressort (fiche « Mon établissement »). La liste officielle des établissements attendus pour ce formulaire n&apos;a pas été fournie ; un établissement qui n&apos;est pas concerné apparaît donc comme « non reçu ».
      </p>
    </>
  );
}
