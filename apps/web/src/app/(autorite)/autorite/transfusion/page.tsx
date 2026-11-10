import type { Metadata } from "next";
import { formulaireStatistique, indicateursFormulaire, type BlocTableau } from "@dps/shared";
import { contexteAutorite, donnees, optionsEtablissements } from "@/lib/autorite-serveur";
import { resumeFiltres, type ParametresUrl } from "@/lib/autorite-filtres";
import { formaterNombre, formaterPourcentage, parEtablissement, pourcentage, serieParPeriode, somme, sommeDe } from "@/lib/autorite-agregats";
import { COULEURS } from "@/lib/chart-theme";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { FiltresBarre } from "@/components/autorite/filtres-barre";
import { GraphiqueAnneau, GraphiqueBarres } from "@/components/autorite/graphiques";
import { SeriesSelectionnables } from "@/components/autorite/series-selectionnables";
import { TableauDonnees } from "@/components/autorite/tableau-donnees";
import { Formule, Provenance, SansDonnees, surtitreAutorite } from "@/components/autorite/elements";
import { IconAlertTriangle, IconCheckCircle, IconDroplet, IconUsers, IconVitals, IconArchive } from "@/components/icons";

export const metadata: Metadata = {
  title: "Transfusion sanguine",
  robots: { index: false, follow: false },
};

const DEF = formulaireStatistique("TRANSFUSION")!;
const tableau = (id: string) => DEF.blocs.find((b) => b.id === id) as BlocTableau;
const ATTRIBUTION = tableau("attribution");
const RECEVEURS = tableau("receveurs");
const SERVICES = tableau("services");
const AFFECTIONS = tableau("affections");
const EIR = tableau("eir");
const PSL = ATTRIBUTION.lignes.filter((l) => !l.somme);
const TRANCHES = RECEVEURS.colonnes.filter((c) => !c.somme);
// Toutes les cases numériques, sauf le taux de satisfaction (un taux ne s'additionne pas).
const CLES = indicateursFormulaire(DEF)
  .filter((i) => i.nature === "nombre" && i.colonneId !== "taux")
  .map((i) => i.cle);
const k = (b: string, l: string, c: string) => `${b}.${l}.${c}`;

// ROADMAP_ESPACE_AUTORITES.md, étape 5.9.
export default async function TransfusionPage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const { autorite, etablissements, filtres, noms } = await contexteAutorite(searchParams);
  const d = await donnees("TRANSFUSION", CLES, filtres);
  const r = d.rapports;
  const resume = resumeFiltres(filtres, noms);
  const entete = (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Transfusion sanguine"
        description={`${DEF.titre} : produits sanguins labiles (PSL), receveurs, services, affections et effets indésirables.`}
      />
      <FiltresBarre etablissements={optionsEtablissements(etablissements)} />
    </>
  );
  if (r.length === 0) return (<>{entete}<SansDonnees formulaire="Transfusion" /></>);

  const demandes = somme(r, k("attribution", "total", "demandee"));
  const bds = somme(r, k("attribution", "total", "servie_bds"));
  const ailleurs = somme(r, k("attribution", "total", "servie_ailleurs"));
  const receveurs = somme(r, k("receveurs", "total", "total"));
  const eir = sommeDe(r, EIR.lignes.map((l) => k("eir", l.id, "nombre")));
  const tests = somme(r, "tculm.tests");
  const testsPositifs = somme(r, "tculm.positifs");
  const malades = somme(r, "tculm.malades");

  const parPsl = PSL.map((l) => ({
    libelle: l.libelle,
    demandee: somme(r, k("attribution", l.id, "demandee")),
    bds: somme(r, k("attribution", l.id, "servie_bds")),
    ailleurs: somme(r, k("attribution", l.id, "servie_ailleurs")),
  }));
  const ages = TRANCHES.map((c) => ({
    libelle: c.entetes[0],
    M: somme(r, k("receveurs", "masculin", c.id)),
    F: somme(r, k("receveurs", "feminin", c.id)),
  }));
  const services = SERVICES.lignes
    .filter((l) => !l.somme)
    .map((l) => ({ libelle: l.libelle, ...Object.fromEntries(SERVICES.colonnes.map((c) => [c.id, somme(r, k("services", l.id, c.id))])) }));
  const affections = AFFECTIONS.lignes.filter((l) => !l.somme).map((l) => ({ label: l.libelle, valeur: somme(r, k("affections", l.id, "nombre")) }));
  const effets = EIR.lignes.map((l) => ({ libelle: l.libelle, n: somme(r, k("eir", l.id, "nombre")) })).sort((a, b) => b.n - a.n);
  const evolution = serieParPeriode(r, [
    { cle: "demandee", cles: [k("attribution", "total", "demandee")] },
    { cle: "servie", cles: [k("attribution", "total", "servie_bds"), k("attribution", "total", "servie_ailleurs")] },
    { cle: "receveurs", cles: [k("receveurs", "total", "total")] },
    { cle: "eir", cles: EIR.lignes.map((l) => k("eir", l.id, "nombre")) },
    { cle: "tests", cles: ["tculm.tests"] },
    ...PSL.map((l) => ({ cle: `psl_${l.id}`, cles: [k("attribution", l.id, "demandee")] })),
  ]);
  const etabs = parEtablissement(r, [
    { cle: "demandee", cles: [k("attribution", "total", "demandee")] },
    { cle: "servie", cles: [k("attribution", "total", "servie_bds"), k("attribution", "total", "servie_ailleurs")] },
    { cle: "receveurs", cles: [k("receveurs", "total", "total")] },
    { cle: "eir", cles: EIR.lignes.map((l) => k("eir", l.id, "nombre")) },
  ]);

  return (
    <>
      {entete}
      <Provenance formulaire="Transfusion" rapports={r.length} filtres={resume} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="PSL demandés" valeur={formaterNombre(demandes)} sousTexte={<Formule>ligne TOTAL, « Quantité demandée »</Formule>} icone={IconDroplet} />
        <StatCard label="PSL servis" valeur={formaterNombre(bds + ailleurs)} sousTexte={`${formaterNombre(bds)} par la BDS · ${formaterNombre(ailleurs)} ailleurs`} icone={IconArchive} ton="info" />
        <StatCard label="Servis / demandés" valeur={formaterPourcentage(pourcentage(bds + ailleurs, demandes))} sousTexte={<Formule>(servie BDS + servie ailleurs) ÷ demandée, sur les totaux de la période</Formule>} icone={IconCheckCircle} ton="success" />
        <StatCard label="Receveurs" valeur={formaterNombre(receveurs)} sousTexte={<Formule>« Caractéristiques des receveurs », Total</Formule>} icone={IconUsers} ton="accent" />
        <StatCard label="Patients avec un EIR" valeur={formaterNombre(eir)} sousTexte={<Formule>somme des {EIR.lignes.length} lignes « Effets indésirables receveurs »</Formule>} icone={IconAlertTriangle} ton="danger" />
        <StatCard label="Tests TCULM" valeur={formaterNombre(tests)} sousTexte={`${formaterNombre(testsPositifs)} positifs · ${formaterNombre(malades)} malades compatibilisés`} icone={IconVitals} ton="neutral" />
      </div>
      <p className="mt-3 text-xs text-text-faint">
        Le « Taux de satisfaction » saisi sur chaque rapport n&apos;est pas additionné (un taux ne se cumule pas) : il reste consultable dans chaque rapport.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader titre="PSL demandés et servis" description={resume} />
          <GraphiqueBarres
            donnees={parPsl}
            cleX="libelle"
            series={[
              { cle: "demandee", label: "Demandée", couleur: COULEURS.primary },
              { cle: "bds", label: "Servie BDS", couleur: COULEURS.success },
              { cle: "ailleurs", label: "Servie ailleurs", couleur: COULEURS.warning },
            ]}
          />
        </Card>
        <Card>
          <CardHeader titre="Receveurs par âge et sexe" />
          <GraphiqueBarres
            donnees={ages}
            cleX="libelle"
            series={[
              { cle: "M", label: "Masculin", couleur: COULEURS.navy },
              { cle: "F", label: "Féminin", couleur: COULEURS.accent },
            ]}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader titre="Services utilisateurs" description="PSL par service" />
          <GraphiqueBarres
            donnees={services}
            cleX="libelle"
            horizontal
            empile
            series={SERVICES.colonnes.map((c) => ({ cle: c.id, label: c.entetes[0] }))}
          />
        </Card>
        <Card>
          <CardHeader titre="Répartition selon les affections" />
          <GraphiqueAnneau donnees={affections} unite="transfusions" />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader titre="Effets indésirables receveurs (EIR)" description="Nombre de patients ayant eu un EIR" />
          <GraphiqueBarres donnees={effets} cleX="libelle" horizontal vide="Aucun EIR déclaré." series={[{ cle: "n", label: "Patients", couleur: COULEURS.danger }]} />
        </Card>
        <Card>
          <CardHeader titre="Évolution mensuelle" />
          <SeriesSelectionnables
            donnees={evolution}
            libelleChoix="Indicateurs"
            options={[
              { cle: "demandee", label: "PSL demandés (total)" },
              { cle: "servie", label: "PSL servis (BDS + ailleurs)" },
              { cle: "receveurs", label: "Receveurs" },
              { cle: "eir", label: "Patients avec un EIR" },
              { cle: "tests", label: "Tests TCULM réalisés" },
              ...PSL.map((l) => ({ cle: `psl_${l.id}`, label: `${l.libelle} — demandé` })),
            ]}
            parDefaut={["demandee", "servie"]}
          />
        </Card>
      </div>

      <h2 className="mb-3 mt-8 font-display text-base font-semibold text-text">Par établissement</h2>
      <TableauDonnees
        id="autorite-transfusion-etablissements"
        nomExport="transfusion-etablissements"
        recherche="Rechercher un établissement…"
        triParDefaut={{ cle: "demandee", direction: "desc" }}
        colonnes={[
          { cle: "nom", entete: "Établissement", lien: "lien" },
          { cle: "commune", entete: "Commune", filtre: true },
          { cle: "rapports", entete: "Mois transmis", format: "nombre" },
          { cle: "demandee", entete: "PSL demandés", format: "nombre" },
          { cle: "servie", entete: "PSL servis", format: "nombre" },
          { cle: "satisfaction", entete: "Servis / demandés", format: "pourcentage" },
          { cle: "receveurs", entete: "Receveurs", format: "nombre" },
          { cle: "eir", entete: "Patients avec un EIR", format: "nombre" },
        ]}
        lignes={etabs.map((e) => ({
          id: e.id,
          lien: `/autorite/etablissements/${e.id}`,
          nom: e.nom,
          commune: e.commune,
          rapports: e.rapports,
          ...e.valeurs,
          satisfaction: pourcentage(e.valeurs.servie, e.valeurs.demandee),
        }))}
      />
    </>
  );
}
