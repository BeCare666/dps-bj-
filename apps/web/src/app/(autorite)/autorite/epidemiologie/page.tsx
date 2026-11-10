import type { Metadata } from "next";
import { formulaireStatistique, type BlocTableau } from "@dps/shared";
import { contexteAutorite, donnees, optionsEtablissements } from "@/lib/autorite-serveur";
import { resumeFiltres, type ParametresUrl } from "@/lib/autorite-filtres";
import { formaterNombre, formaterPourcentage, parEtablissement, pourcentage, serieParPeriode, somme } from "@/lib/autorite-agregats";
import { COULEURS } from "@/lib/chart-theme";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { FiltresBarre } from "@/components/autorite/filtres-barre";
import { GraphiqueAnneau, GraphiqueBarres } from "@/components/autorite/graphiques";
import { SeriesSelectionnables } from "@/components/autorite/series-selectionnables";
import { TableauDonnees } from "@/components/autorite/tableau-donnees";
import { Formule, Provenance, SansDonnees, surtitreAutorite } from "@/components/autorite/elements";
import { IconAlertTriangle, IconBarChart, IconHospital, IconRoute, IconUsers, IconVirus } from "@/components/icons";

export const metadata: Metadata = {
  title: "Épidémiologie (BS-a)",
  robots: { index: false, follow: false },
};

const DEF = formulaireStatistique("BS_A")!;
const BLOC = DEF.blocs.find((b) => b.id === "affections") as BlocTableau;

// Affections du formulaire BS-a, telles qu'imprimées (numéro, libellé,
// ligne « Décès » absente pour le paludisme simple).
const AFFECTIONS = BLOC.lignes
  .filter((l) => l.sousLibelle === "Cas" && !l.somme)
  .map((l) => {
    const id = l.id.replace(/_cas$/, "");
    const aDeces = BLOC.lignes.some((x) => x.id === `${id}_deces`);
    return {
      id,
      libelle: l.libelle,
      cas: `affections.${l.id}.total_general`,
      deces: aDeces ? `affections.${id}_deces.total_general` : null,
      // « (1) déclaration obligatoire hebdomadaire » (note du formulaire).
      obligatoire: l.libelle.includes("(1)"),
    };
  });

// Tranches d'âge et sexes du formulaire (bloc non hospitalisés + hospitalisés).
const AGES = BLOC.colonnes
  .filter((c) => c.id.startsWith("nh_") && c.id.endsWith("_M"))
  .map((c) => ({ id: c.id.slice(3, -2), libelle: c.entetes[1] }));

const CLE = (ligne: string, colonne: string) => `affections.${ligne}.${colonne}`;
const CLES = [
  ...AFFECTIONS.flatMap((a) => (a.deces ? [a.cas, a.deces] : [a.cas])),
  ...BLOC.colonnes.map((c) => CLE("total_cas", c.id)),
  CLE("total_deces", "total_general"),
  CLE("total_deces", "h_total"),
  "consultants.nouveaux",
  "consultants.anciens",
];

// ROADMAP_ESPACE_AUTORITES.md, étape 5.5.
export default async function EpidemiologiePage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const { autorite, etablissements, filtres, noms } = await contexteAutorite(searchParams);
  const d = await donnees("BS_A", CLES, filtres);
  const r = d.rapports;
  const resume = resumeFiltres(filtres, noms);

  const entete = (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Épidémiologie"
        description={`${DEF.titre} (BS-a) : cas et décès par affection, âge, sexe et établissement.`}
      />
      <FiltresBarre etablissements={optionsEtablissements(etablissements)} />
    </>
  );
  if (r.length === 0) return (<>{entete}<SansDonnees formulaire="BS-a" /></>);

  const totalCas = somme(r, CLE("total_cas", "total_general"));
  const totalDeces = somme(r, CLE("total_deces", "total_general"));
  const hospitalises = somme(r, CLE("total_cas", "h_total"));
  const nonHospitalises = somme(r, CLE("total_cas", "nh_total"));
  const referes = somme(r, CLE("total_cas", "cas_referes"));
  const nouveaux = somme(r, "consultants.nouveaux");
  const anciens = somme(r, "consultants.anciens");

  const parAffection = AFFECTIONS.map((a) => {
    const cas = somme(r, a.cas);
    const deces = a.deces ? somme(r, a.deces) : null;
    return { ...a, nbCas: cas, nbDeces: deces, letalite: deces === null ? null : pourcentage(deces, cas), part: pourcentage(cas, totalCas) };
  });
  const classement = [...parAffection].sort((x, y) => y.nbCas - x.nbCas);
  const top = classement.slice(0, 15).map((a) => ({ libelle: a.libelle, cas: a.nbCas, deces: a.nbDeces ?? 0 }));

  const evolution = serieParPeriode(r, [
    { cle: "total", cles: [CLE("total_cas", "total_general")] },
    { cle: "deces", cles: [CLE("total_deces", "total_general")] },
    ...AFFECTIONS.map((a) => ({ cle: a.id, cles: [a.cas] })),
  ]);

  const pyramide = AGES.map((age) => ({
    libelle: age.libelle,
    M: somme(r, CLE("total_cas", `nh_${age.id}_M`)) + somme(r, CLE("total_cas", `h_${age.id}_M`)),
    F: somme(r, CLE("total_cas", `nh_${age.id}_F`)) + somme(r, CLE("total_cas", `h_${age.id}_F`)),
  }));

  const etabs = parEtablissement(r, [
    { cle: "cas", cles: [CLE("total_cas", "total_general")] },
    { cle: "deces", cles: [CLE("total_deces", "total_general")] },
    { cle: "hospitalises", cles: [CLE("total_cas", "h_total")] },
    { cle: "referes", cles: [CLE("total_cas", "cas_referes")] },
    { cle: "nouveaux", cles: ["consultants.nouveaux"] },
    { cle: "anciens", cles: ["consultants.anciens"] },
  ]);

  return (
    <>
      {entete}
      <Provenance formulaire="BS-a" rapports={r.length} filtres={resume} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Cas" valeur={formaterNombre(totalCas)} sousTexte={<Formule>ligne TOTAL « Cas », colonne « Total général »</Formule>} icone={IconVirus} />
        <StatCard label="Décès" valeur={formaterNombre(totalDeces)} sousTexte={<Formule>ligne TOTAL « Décès », colonne « Total général »</Formule>} icone={IconAlertTriangle} ton="danger" />
        <StatCard label="Décès / cas" valeur={formaterPourcentage(pourcentage(totalDeces, totalCas))} sousTexte={<Formule>décès ÷ cas × 100 (le paludisme simple n&apos;a pas de ligne « Décès »)</Formule>} icone={IconBarChart} ton="warning" />
        <StatCard label="Cas hospitalisés" valeur={formaterNombre(hospitalises)} sousTexte={<Formule>{formaterPourcentage(pourcentage(hospitalises, totalCas))} des cas · bloc « Consultants hospitalisés »</Formule>} icone={IconHospital} ton="info" />
        <StatCard label="Cas référés" valeur={formaterNombre(referes)} sousTexte={<Formule>colonne « Cas référés », ligne TOTAL « Cas »</Formule>} icone={IconRoute} ton="accent" />
        <StatCard label="Nouveaux consultants" valeur={formaterNombre(nouveaux)} sousTexte={`${formaterNombre(anciens)} anciens consultants`} icone={IconUsers} ton="neutral" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader titre="Affections les plus fréquentes" description={`15 premières sur ${AFFECTIONS.length}, par nombre de cas · ${resume}`} />
          <GraphiqueBarres
            donnees={top}
            cleX="libelle"
            horizontal
            series={[
              { cle: "cas", label: "Cas", couleur: COULEURS.primary },
              { cle: "deces", label: "Décès", couleur: COULEURS.danger },
            ]}
          />
        </Card>
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader titre="Cas par mode de prise en charge" />
            <GraphiqueAnneau
              unite="cas"
              donnees={[
                { label: "Non hospitalisés", valeur: nonHospitalises, couleur: COULEURS.primary },
                { label: "Hospitalisés", valeur: hospitalises, couleur: COULEURS.accent },
              ]}
            />
          </Card>
          <Card>
            <CardHeader titre="Cas par âge et sexe" description="Non hospitalisés + hospitalisés" />
            <GraphiqueBarres
              donnees={pyramide}
              cleX="libelle"
              hauteur={260}
              series={[
                { cle: "M", label: "Masculin", couleur: COULEURS.navy },
                { cle: "F", label: "Féminin", couleur: COULEURS.accent },
              ]}
            />
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader titre="Évolution mensuelle" description="Choisissez les affections à comparer et le type de graphique" />
        <SeriesSelectionnables
          donnees={evolution}
          libelleChoix="Affections"
          options={[
            { cle: "total", label: "Total des cas" },
            { cle: "deces", label: "Total des décès" },
            ...AFFECTIONS.map((a) => ({ cle: a.id, label: `${a.libelle} — cas` })),
          ]}
          parDefaut={["total", ...classement.slice(0, 4).map((a) => a.id)]}
        />
      </Card>

      <Card className="mt-6">
        <CardHeader
          titre="Affections à déclaration obligatoire"
          description="Affections marquées (1) sur le formulaire : « déclaration obligatoire hebdomadaire »"
        />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {parAffection
            .filter((a) => a.obligatoire)
            .map((a) => (
              <div key={a.id} className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 ${a.nbCas > 0 ? "border-danger/30 bg-danger-soft/40" : "border-border"}`}>
                <span className="min-w-0 truncate text-sm text-text">{a.libelle}</span>
                <span className="shrink-0 text-sm tabular-nums">
                  <span className="font-semibold text-text">{formaterNombre(a.nbCas)}</span>
                  <span className="text-text-faint"> cas · {formaterNombre(a.nbDeces)} décès</span>
                </span>
              </div>
            ))}
        </div>
      </Card>

      <h2 className="mb-3 mt-8 font-display text-base font-semibold text-text">Détail par affection</h2>
      <TableauDonnees
        id="autorite-bsa-affections"
        nomExport="bs-a-affections"
        recherche="Rechercher une affection…"
        tailleDePage={25}
        triParDefaut={{ cle: "cas", direction: "desc" }}
        colonnes={[
          { cle: "affection", entete: "Affection" },
          { cle: "cas", entete: "Cas", format: "nombre" },
          { cle: "deces", entete: "Décès", format: "nombre" },
          { cle: "letalite", entete: "Décès / cas", format: "pourcentage" },
          { cle: "part", entete: "Part des cas", format: "pourcentage" },
          { cle: "obligatoire", entete: "Déclaration obligatoire", filtre: true },
        ]}
        lignes={parAffection.map((a) => ({
          id: a.id,
          affection: a.libelle,
          cas: a.nbCas,
          deces: a.nbDeces,
          letalite: a.letalite,
          part: a.part,
          obligatoire: a.obligatoire ? "Oui" : "Non",
        }))}
      />

      <h2 className="mb-3 mt-8 font-display text-base font-semibold text-text">Par établissement</h2>
      <Card className="mb-6">
        <GraphiqueBarres
          donnees={etabs.map((e) => ({ libelle: e.nom, cas: e.valeurs.cas, deces: e.valeurs.deces }))}
          cleX="libelle"
          horizontal
          series={[
            { cle: "cas", label: "Cas", couleur: COULEURS.primary },
            { cle: "deces", label: "Décès", couleur: COULEURS.danger },
          ]}
        />
      </Card>
      <TableauDonnees
        id="autorite-bsa-etablissements"
        nomExport="bs-a-etablissements"
        recherche="Rechercher un établissement…"
        triParDefaut={{ cle: "cas", direction: "desc" }}
        colonnes={[
          { cle: "nom", entete: "Établissement", lien: "lien" },
          { cle: "commune", entete: "Commune", filtre: true },
          { cle: "rapports", entete: "Rapports", format: "nombre" },
          { cle: "cas", entete: "Cas", format: "nombre" },
          { cle: "deces", entete: "Décès", format: "nombre" },
          { cle: "hospitalises", entete: "Hospitalisés", format: "nombre" },
          { cle: "referes", entete: "Référés", format: "nombre" },
          { cle: "nouveaux", entete: "Nouveaux consultants", format: "nombre", masqueeParDefaut: true },
          { cle: "anciens", entete: "Anciens consultants", format: "nombre", masqueeParDefaut: true },
        ]}
        lignes={etabs.map((e) => ({ id: e.id, lien: `/autorite/etablissements/${e.id}`, nom: e.nom, commune: e.commune, rapports: e.rapports, ...e.valeurs }))}
      />
    </>
  );
}
