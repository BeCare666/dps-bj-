import type { Metadata } from "next";
import { formulaireStatistique, indicateursFormulaire, type BlocTableau, type DefinitionFormulaire, type Ligne } from "@dps/shared";
import { contexteAutorite, donnees, optionsEtablissements } from "@/lib/autorite-serveur";
import { resumeFiltres, type ParametresUrl } from "@/lib/autorite-filtres";
import { formaterNombre, parEtablissement, serieParPeriode, somme } from "@/lib/autorite-agregats";
import { COULEURS } from "@/lib/chart-theme";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { FiltresBarre, SelecteurUrl } from "@/components/autorite/filtres-barre";
import { GraphiqueBarres } from "@/components/autorite/graphiques";
import { SeriesSelectionnables } from "@/components/autorite/series-selectionnables";
import { TableauDonnees } from "@/components/autorite/tableau-donnees";
import { Formule, Provenance, SansDonnees, surtitreAutorite } from "@/components/autorite/elements";
import { IconAlertTriangle, IconHeartPulse, IconRoute, IconUsers, IconVitals, IconEye } from "@/components/icons";
import type { DonneesAutorite } from "@/lib/types";

export const metadata: Metadata = {
  title: "Maladies non transmissibles",
  robots: { index: false, follow: false },
};

// Variables des deux formulaires PNLMNT, avec leur rubrique imprimée.
interface Variable {
  formulaire: "PNLMNT1" | "PNLMNT2";
  blocId: string;
  ligne: Ligne;
  rubrique: string;
  colonnes: string[];
  total: string | null;
}

function variables(def: DefinitionFormulaire): Variable[] {
  const valides = new Set(indicateursFormulaire(def).map((i) => i.cle));
  const liste: Variable[] = [];
  for (const b of def.blocs) {
    if (b.type !== "tableau") continue;
    const bloc = b as BlocTableau;
    let rubrique = bloc.titre ?? "";
    for (const l of bloc.lignes) {
      if (l.section) {
        rubrique = l.libelle;
        continue;
      }
      const cles = bloc.colonnes.map((c) => `${bloc.id}.${l.id}.${c.id}`).filter((k) => valides.has(k));
      const total = `${bloc.id}.${l.id}.total`;
      liste.push({
        formulaire: def.code as Variable["formulaire"],
        blocId: bloc.id,
        ligne: l,
        rubrique: bloc.id === "femmes_enceintes" ? "MNT chez les femmes enceintes" : rubrique || "Autres variables",
        colonnes: cles.filter((k) => k !== total),
        total: valides.has(total) ? total : null,
      });
    }
  }
  return liste;
}

const VARIABLES = [...variables(formulaireStatistique("PNLMNT1")!), ...variables(formulaireStatistique("PNLMNT2")!)];
const RUBRIQUES = [...new Set(VARIABLES.map((v) => v.rubrique))];
const id = (v: Variable) => `v${v.ligne.ref}`;
const libelle = (v: Variable) => `${v.ligne.ref}. ${v.ligne.libelle}`;
// Valeur d'une variable : sa colonne Total, ou la somme de ses cases (variables à cases fusionnées).
const clesVariable = (v: Variable) => (v.total ? [v.total] : v.colonnes);
const parRef = (ref: number) => VARIABLES.find((v) => v.ligne.ref === String(ref))!;

const TRANCHES = [
  ["lt15", "< 15 ans"],
  ["a15_29", "15-29 ans"],
  ["a30_44", "30-44 ans"],
  ["a45_59", "45-59 ans"],
  ["a60p", "60 ans et +"],
] as const;

function fusion(a: DonneesAutorite, b: DonneesAutorite): DonneesAutorite["rapports"] {
  return [...a.rapports, ...b.rapports];
}

// ROADMAP_ESPACE_AUTORITES.md, étape 5.8 — PNLMNT 1 et 2.
export default async function MntPage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const { params, autorite, etablissements, filtres, noms } = await contexteAutorite(searchParams);
  const cles = (f: Variable["formulaire"]) => VARIABLES.filter((v) => v.formulaire === f).flatMap((v) => [...v.colonnes, ...(v.total ? [v.total] : [])]);
  const [d1, d2] = await Promise.all([donnees("PNLMNT1", cles("PNLMNT1"), filtres), donnees("PNLMNT2", cles("PNLMNT2"), filtres)]);
  const r1 = d1.rapports;
  const r2 = d2.rapports;
  const de = (v: Variable) => (v.formulaire === "PNLMNT1" ? r1 : r2);
  const total = (v: Variable) => clesVariable(v).reduce((s, k) => s + somme(de(v), k), 0);
  const resume = resumeFiltres(filtres, noms);

  const rubrique = RUBRIQUES.includes(String(params.rubrique)) ? String(params.rubrique) : "";
  const variableChoisie = VARIABLES.find((v) => id(v) === params.variable && v.blocId === "mnt") ?? parRef(4);

  const entete = (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Maladies non transmissibles"
        description="Rapports mensuels PNLMNT 1 et 2 : dépistage, complications, prise en charge, femmes enceintes, cécité, santé mentale, accidents de la voie publique."
      />
      <FiltresBarre etablissements={optionsEtablissements(etablissements)}>
        <SelecteurUrl
          parametre="rubrique"
          libelle="Rubrique"
          valeur={rubrique}
          options={[{ valeur: "", libelle: "Toutes les rubriques" }, ...RUBRIQUES.map((x) => ({ valeur: x, libelle: x }))]}
        />
      </FiltresBarre>
    </>
  );
  if (r1.length + r2.length === 0) return (<>{entete}<SansDonnees formulaire="PNLMNT" /></>);

  const rubriques = RUBRIQUES.filter((x) => !rubrique || x === rubrique);
  const evolution = serieParPeriode(fusion(d1, d2), VARIABLES.map((v) => ({ cle: id(v), cles: clesVariable(v) })));
  const ages = TRANCHES.map(([t, l]) => ({
    libelle: l,
    M: somme(de(variableChoisie), `mnt.${variableChoisie.ligne.id}.M_${t}`),
    F: somme(de(variableChoisie), `mnt.${variableChoisie.ligne.id}.F_${t}`),
  }));
  const etabs = parEtablissement(fusion(d1, d2), [
    { cle: "diabete", cles: clesVariable(parRef(2)) },
    { cle: "hta", cles: clesVariable(parRef(4)) },
    { cle: "avc", cles: clesVariable(parRef(8)) },
    { cle: "decesMnt", cles: [...clesVariable(parRef(22)), ...clesVariable(parRef(23))] },
    { cle: "santeMentale", cles: clesVariable(parRef(45)) },
    { cle: "avp", cles: clesVariable(parRef(54)) },
    { cle: "decesAvp", cles: clesVariable(parRef(61)) },
  ]);

  return (
    <>
      {entete}
      <Provenance formulaire="PNLMNT 1 et 2" rapports={r1.length + r2.length} filtres={`${r1.length} PNLMNT 1, ${r2.length} PNLMNT 2${resume ? ` · ${resume}` : ""}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Nouveaux cas d'HTA" valeur={formaterNombre(total(parRef(4)))} sousTexte={<Formule>variable 4, colonne Total</Formule>} icone={IconHeartPulse} />
        <StatCard label="Nouveaux cas de diabète" valeur={formaterNombre(total(parRef(2)))} sousTexte={<Formule>variable 2, colonne Total</Formule>} icone={IconVitals} ton="info" />
        <StatCard label="Décès liés au diabète ou à l'HTA" valeur={formaterNombre(total(parRef(22)) + total(parRef(23)))} sousTexte={<Formule>variables 22 + 23</Formule>} icone={IconAlertTriangle} ton="danger" />
        <StatCard label="Nouveaux consultants santé mentale" valeur={formaterNombre(total(parRef(45)))} sousTexte={<Formule>variable 45</Formule>} icone={IconUsers} ton="accent" />
        <StatCard label="Cataractes dépistées" valeur={formaterNombre(total(parRef(38)))} sousTexte={`${formaterNombre(total(parRef(39)))} opérées (variable 39)`} icone={IconEye} ton="neutral" />
        <StatCard label="Accidents de la voie publique" valeur={formaterNombre(total(parRef(54)))} sousTexte={`${formaterNombre(total(parRef(61)))} victimes décédées (variable 61)`} icone={IconRoute} ton="warning" />
      </div>

      <Card className="mt-6">
        <CardHeader titre="Évolution mensuelle" description="Choisissez les variables à comparer" />
        <SeriesSelectionnables
          donnees={evolution}
          libelleChoix="Variables"
          options={VARIABLES.map((v) => ({ cle: id(v), label: libelle(v) }))}
          parDefaut={["v2", "v4", "v54"]}
        />
      </Card>

      <Card className="mt-6">
        <CardHeader
          titre="Répartition par âge et sexe"
          description={libelle(variableChoisie)}
          action={
            <SelecteurUrl
              parametre="variable"
              libelle="Variable"
              valeur={id(variableChoisie)}
              options={VARIABLES.filter((v) => v.blocId === "mnt" && !v.ligne.fusions).map((v) => ({ valeur: id(v), libelle: libelle(v) }))}
            />
          }
        />
        <GraphiqueBarres
          donnees={ages}
          cleX="libelle"
          hauteur={260}
          series={[
            { cle: "M", label: "Masculin", couleur: COULEURS.navy },
            { cle: "F", label: "Féminin", couleur: COULEURS.accent },
          ]}
        />
      </Card>

      {rubriques.map((x) => {
        const vars = VARIABLES.filter((v) => v.rubrique === x);
        const avecSexe = vars.every((v) => v.blocId === "mnt");
        const lignes = vars.map((v) => {
          const rapports = de(v);
          const masculin = v.colonnes.filter((k) => k.includes(".M_")).reduce((s, k) => s + somme(rapports, k), 0);
          const feminin = v.colonnes.filter((k) => k.includes(".F_")).reduce((s, k) => s + somme(rapports, k), 0);
          return { v, libelle: libelle(v), total: total(v), masculin, feminin };
        });
        return (
          <Card key={x} className="mt-6">
            <CardHeader titre={x} description={`${vars.length} variable${vars.length > 1 ? "s" : ""} · ${vars[0].formulaire === "PNLMNT1" ? "PNLMNT 1" : "PNLMNT 2"}`} />
            <GraphiqueBarres
              donnees={lignes.map((l): Record<string, string | number> =>
                avecSexe ? { libelle: l.libelle, masculin: l.masculin, feminin: l.feminin } : { libelle: l.libelle, total: l.total },
              )}
              cleX="libelle"
              horizontal
              empile={avecSexe}
              series={
                avecSexe
                  ? [
                      { cle: "masculin", label: "Masculin", couleur: COULEURS.navy },
                      { cle: "feminin", label: "Féminin", couleur: COULEURS.accent },
                    ]
                  : [{ cle: "total", label: "Total", couleur: COULEURS.primary }]
              }
            />
          </Card>
        );
      })}

      <h2 className="mb-3 mt-8 font-display text-base font-semibold text-text">Toutes les variables</h2>
      <TableauDonnees
        id="autorite-mnt-variables"
        nomExport="pnlmnt-variables"
        recherche="Rechercher une variable…"
        tailleDePage={25}
        colonnes={[
          { cle: "variable", entete: "Variable" },
          { cle: "rubrique", entete: "Rubrique", filtre: true },
          { cle: "formulaire", entete: "Formulaire", filtre: true },
          { cle: "total", entete: "Total", format: "nombre" },
          ...TRANCHES.flatMap(([t, l]) => [
            { cle: `M_${t}`, entete: `M ${l}`, format: "nombre" as const, masqueeParDefaut: true },
            { cle: `F_${t}`, entete: `F ${l}`, format: "nombre" as const, masqueeParDefaut: true },
          ]),
        ]}
        lignes={VARIABLES.map((v) => ({
          id: `${v.formulaire}-${v.ligne.id}-${v.blocId}`,
          variable: libelle(v),
          rubrique: v.rubrique,
          formulaire: v.formulaire === "PNLMNT1" ? "PNLMNT 1" : "PNLMNT 2",
          total: total(v),
          ...Object.fromEntries(
            TRANCHES.flatMap(([t]) => ["M", "F"].map((s) => {
              const k = `${v.blocId}.${v.ligne.id}.${s}_${t}`;
              return [`${s}_${t}`, v.colonnes.includes(k) ? somme(de(v), k) : null];
            })),
          ),
        }))}
      />

      <h2 className="mb-3 mt-8 font-display text-base font-semibold text-text">Par établissement</h2>
      <TableauDonnees
        id="autorite-mnt-etablissements"
        nomExport="pnlmnt-etablissements"
        recherche="Rechercher un établissement…"
        triParDefaut={{ cle: "hta", direction: "desc" }}
        colonnes={[
          { cle: "nom", entete: "Établissement", lien: "lien" },
          { cle: "commune", entete: "Commune", filtre: true },
          { cle: "rapports", entete: "Rapports", format: "nombre" },
          { cle: "hta", entete: "Nouveaux cas HTA (4)", format: "nombre" },
          { cle: "diabete", entete: "Nouveaux cas diabète (2)", format: "nombre" },
          { cle: "avc", entete: "AVC (8)", format: "nombre", masqueeParDefaut: true },
          { cle: "decesMnt", entete: "Décès diabète + HTA (22 + 23)", format: "nombre" },
          { cle: "santeMentale", entete: "Santé mentale (45)", format: "nombre", masqueeParDefaut: true },
          { cle: "avp", entete: "AVP (54)", format: "nombre" },
          { cle: "decesAvp", entete: "Victimes AVP décédées (61)", format: "nombre", masqueeParDefaut: true },
        ]}
        lignes={etabs.map((e) => ({ id: e.id, lien: `/autorite/etablissements/${e.id}`, nom: e.nom, commune: e.commune, rapports: e.rapports, ...e.valeurs }))}
      />
    </>
  );
}
