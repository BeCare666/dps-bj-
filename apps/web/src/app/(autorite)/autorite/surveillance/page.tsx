import type { Metadata } from "next";
import { formulaireStatistique, type BlocTableau } from "@dps/shared";
import { contexteAutorite, donnees, optionsEtablissements } from "@/lib/autorite-serveur";
import { resumeFiltres, type ParametresUrl } from "@/lib/autorite-filtres";
import { formaterNombre, parEtablissement, serieParPeriode, somme, sommeDe } from "@/lib/autorite-agregats";
import { COULEURS } from "@/lib/chart-theme";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { FiltresBarre } from "@/components/autorite/filtres-barre";
import { GraphiqueBarres } from "@/components/autorite/graphiques";
import { SeriesSelectionnables } from "@/components/autorite/series-selectionnables";
import { TableauDonnees } from "@/components/autorite/tableau-donnees";
import { Formule, Provenance, SansDonnees, surtitreAutorite } from "@/components/autorite/elements";
import { IconAlertTriangle, IconCheckCircle, IconHeartPulse, IconTarget, IconVirus, IconTrendingUp } from "@/components/icons";

export const metadata: Metadata = {
  title: "Surveillance hebdomadaire",
  robots: { index: false, follow: false },
};

const DEF = formulaireStatistique("SIMR_HEBDO")!;
const bloc = (id: string) => DEF.blocs.find((b) => b.id === id) as BlocTableau;
const MALADIES = bloc("maladies").lignes.filter((l) => !l.section);
const DECES = bloc("deces").lignes;
const FLAMBEES = bloc("flambees").lignes;
const PALUDISME = bloc("paludisme").lignes;
const SOUS_GROUPES = [
  { id: "m5_M", libelle: "<5 ans · M" },
  { id: "m5_F", libelle: "<5 ans · F" },
  { id: "p5_M", libelle: "≥5 ans · M" },
  { id: "p5_F", libelle: "≥5 ans · F" },
];

const cle = (b: string, l: string, c: string) => `${b}.${l}.${c}`;
const CLES = [
  ...MALADIES.flatMap((m) => ["sus", "dec", "conf"].flatMap((g) => [cle("maladies", m.id, `${g}_total`), ...SOUS_GROUPES.map((s) => cle("maladies", m.id, `${g}_${s.id}`))])),
  ...DECES.map((l) => cle("deces", l.id, "nombre")),
  ...FLAMBEES.map((l) => cle("flambees", l.id, "nombre")),
  ...PALUDISME.flatMap((p) => ["dec", "conf"].flatMap((g) => [cle("paludisme", p.id, `${g}_total`), ...SOUS_GROUPES.map((s) => cle("paludisme", p.id, `${g}_${s.id}`))])),
];

// ROADMAP_ESPACE_AUTORITES.md, étape 5.6 — formulaire 12_BJ (semaines ISO).
export default async function SurveillancePage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const { autorite, etablissements, filtres, noms } = await contexteAutorite(searchParams, "3m");
  const d = await donnees("SIMR_HEBDO", CLES, filtres);
  const r = d.rapports;
  const resume = resumeFiltres(filtres, noms);
  const entete = (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Surveillance hebdomadaire"
        description={`${DEF.titre} (12_BJ) : maladies sous surveillance, décès, flambées et paludisme, semaine par semaine.`}
      />
      <FiltresBarre etablissements={optionsEtablissements(etablissements)} raccourciParDefaut="3m" />
    </>
  );
  if (r.length === 0) return (<>{entete}<SansDonnees formulaire="12_BJ" /></>);

  const toutes = (g: string) => MALADIES.map((m) => cle("maladies", m.id, `${g}_total`));
  const suspects = sommeDe(r, toutes("sus"));
  const decesMaladies = sommeDe(r, toutes("dec"));
  const confirmes = sommeDe(r, toutes("conf"));
  const paluConfirmes = sommeDe(r, PALUDISME.map((p) => cle("paludisme", p.id, "conf_total")));
  const flambees = sommeDe(r, FLAMBEES.map((l) => cle("flambees", l.id, "nombre")));
  const decesMaternels = somme(r, cle("deces", "maternel", "nombre"));

  const parMaladie = MALADIES.map((m) => ({
    id: m.id,
    libelle: m.libelle,
    suspects: somme(r, cle("maladies", m.id, "sus_total")),
    deces: somme(r, cle("maladies", m.id, "dec_total")),
    confirmes: somme(r, cle("maladies", m.id, "conf_total")),
    ...Object.fromEntries(SOUS_GROUPES.map((s) => [s.id, somme(r, cle("maladies", m.id, `sus_${s.id}`))])),
  }));
  const signalees = parMaladie.filter((m) => m.suspects + m.deces + m.confirmes > 0).sort((a, b) => b.suspects - a.suspects);

  const evolution = serieParPeriode(r, [
    { cle: "suspects", cles: toutes("sus") },
    { cle: "deces", cles: toutes("dec") },
    { cle: "confirmes", cles: toutes("conf") },
    ...MALADIES.map((m) => ({ cle: m.id, cles: [cle("maladies", m.id, "sus_total")] })),
  ]);
  const evolutionDeces = serieParPeriode(r, DECES.map((l) => ({ cle: l.id, cles: [cle("deces", l.id, "nombre")] })));
  const evolutionPalu = serieParPeriode(r, PALUDISME.map((p) => ({ cle: p.id, cles: [cle("paludisme", p.id, "conf_total")] })));
  const etabs = parEtablissement(r, [
    { cle: "suspects", cles: toutes("sus") },
    { cle: "deces", cles: toutes("dec") },
    { cle: "confirmes", cles: toutes("conf") },
    { cle: "paludisme", cles: PALUDISME.map((p) => cle("paludisme", p.id, "conf_total")) },
    { cle: "flambees", cles: FLAMBEES.map((l) => cle("flambees", l.id, "nombre")) },
  ]);

  return (
    <>
      {entete}
      <Provenance formulaire="12_BJ" rapports={r.length} filtres={resume} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Cas suspects" valeur={formaterNombre(suspects)} sousTexte={<Formule>somme des colonnes « Suspect · Total » des {MALADIES.length} lignes</Formule>} icone={IconVirus} />
        <StatCard label="Décès (maladies)" valeur={formaterNombre(decesMaladies)} sousTexte={<Formule>somme des colonnes « Décès · Total »</Formule>} icone={IconAlertTriangle} ton="danger" />
        <StatCard label="Cas confirmés" valeur={formaterNombre(confirmes)} sousTexte={<Formule>somme des colonnes « Confirmé · Total »</Formule>} icone={IconCheckCircle} ton="success" />
        <StatCard label="Paludisme confirmé" valeur={formaterNombre(paluConfirmes)} sousTexte={<Formule>« Situation du paludisme », colonne « Confirmé · Total »</Formule>} icone={IconTarget} ton="warning" />
        <StatCard label="Décès maternels" valeur={formaterNombre(decesMaternels)} sousTexte="« Situation des décès »" icone={IconHeartPulse} ton="accent" />
        <StatCard label="Flambées (toutes rubriques)" valeur={formaterNombre(flambees)} sousTexte={<Formule>somme des 4 lignes « Situation des flambées »</Formule>} icone={IconTrendingUp} ton="info" />
      </div>

      <Card className="mt-6">
        <CardHeader titre="Évolution hebdomadaire" description={`Choisissez les maladies (cas suspects) et le type de graphique · ${resume}`} />
        <SeriesSelectionnables
          donnees={evolution}
          libelleChoix="Maladies"
          options={[
            { cle: "suspects", label: "Total des cas suspects" },
            { cle: "deces", label: "Total des décès" },
            { cle: "confirmes", label: "Total des cas confirmés" },
            ...MALADIES.map((m) => ({ cle: m.id, label: `${m.libelle} — suspects` })),
          ]}
          parDefaut={["suspects", "deces", "confirmes"]}
        />
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader titre="Maladies signalées" description={`${signalees.length} maladie${signalees.length > 1 ? "s" : ""} sur ${MALADIES.length} avec au moins un cas ou un décès`} />
          <GraphiqueBarres
            donnees={signalees.map((m) => ({ libelle: m.libelle, suspects: m.suspects, deces: m.deces, confirmes: m.confirmes }))}
            cleX="libelle"
            horizontal
            vide="Aucun cas ni décès déclaré sur la période."
            series={[
              { cle: "suspects", label: "Suspects", couleur: COULEURS.primary },
              { cle: "confirmes", label: "Confirmés", couleur: COULEURS.success },
              { cle: "deces", label: "Décès", couleur: COULEURS.danger },
            ]}
          />
        </Card>
        <Card>
          <CardHeader titre="Situation des décès" description="Par semaine, lignes du formulaire" />
          <SeriesSelectionnables
            donnees={evolutionDeces}
            libelleChoix="Rubriques"
            options={DECES.map((l) => ({ cle: l.id, label: l.libelle }))}
            parDefaut={DECES.map((l) => l.id)}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader titre="Paludisme confirmé par semaine" description="« Situation du paludisme », colonne Confirmé · Total" />
          <GraphiqueBarres
            donnees={evolutionPalu}
            cleX="libelle"
            empile
            series={PALUDISME.map((p) => ({ cle: p.id, label: p.libelle }))}
          />
        </Card>
        <Card>
          <CardHeader titre="Situation des flambées" description="Total de la période, par rubrique" />
          <ul className="flex flex-col gap-3">
            {FLAMBEES.map((l) => {
              const n = somme(r, cle("flambees", l.id, "nombre"));
              return (
                <li key={l.id} className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-4 py-3 ${n > 0 ? "border-danger/30 bg-danger-soft/40" : "border-border"}`}>
                  <span className="text-sm text-text">{l.libelle}</span>
                  <span className="font-display text-lg font-semibold tabular-nums text-text">{formaterNombre(n)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-text-faint">Aucun seuil d&apos;alerte épidémique n&apos;a été fourni : les chiffres sont affichés tels que déclarés.</p>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 font-display text-base font-semibold text-text">Détail par maladie</h2>
      <TableauDonnees
        id="autorite-simr-maladies"
        nomExport="12bj-maladies"
        recherche="Rechercher une maladie…"
        tailleDePage={25}
        triParDefaut={{ cle: "suspects", direction: "desc" }}
        colonnes={[
          { cle: "maladie", entete: "Maladie / événement" },
          { cle: "suspects", entete: "Suspects", format: "nombre" },
          { cle: "confirmes", entete: "Confirmés", format: "nombre" },
          { cle: "deces", entete: "Décès", format: "nombre" },
          ...SOUS_GROUPES.map((s) => ({ cle: s.id, entete: `Suspects ${s.libelle}`, format: "nombre" as const, masqueeParDefaut: true })),
        ]}
        lignes={parMaladie.map((m) => ({ ...m, maladie: m.libelle }))}
      />

      <h2 className="mb-3 mt-8 font-display text-base font-semibold text-text">Par établissement</h2>
      <TableauDonnees
        id="autorite-simr-etablissements"
        nomExport="12bj-etablissements"
        recherche="Rechercher un établissement…"
        triParDefaut={{ cle: "suspects", direction: "desc" }}
        colonnes={[
          { cle: "nom", entete: "Établissement", lien: "lien" },
          { cle: "commune", entete: "Commune", filtre: true },
          { cle: "rapports", entete: "Semaines transmises", format: "nombre" },
          { cle: "suspects", entete: "Suspects", format: "nombre" },
          { cle: "confirmes", entete: "Confirmés", format: "nombre" },
          { cle: "deces", entete: "Décès", format: "nombre" },
          { cle: "paludisme", entete: "Paludisme confirmé", format: "nombre" },
          { cle: "flambees", entete: "Flambées", format: "nombre" },
        ]}
        lignes={etabs.map((e) => ({ id: e.id, lien: `/autorite/etablissements/${e.id}`, nom: e.nom, commune: e.commune, rapports: e.rapports, ...e.valeurs }))}
      />
    </>
  );
}
