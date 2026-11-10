import type { Metadata } from "next";
import { formulaireStatistique, indicateursFormulaire, type BlocOuiNon, type BlocTableau } from "@dps/shared";
import { contexteAutorite, donnees, optionsEtablissements } from "@/lib/autorite-serveur";
import { resumeFiltres, type ParametresUrl } from "@/lib/autorite-filtres";
import { compteOui, formaterNombre, formaterPourcentage, parEtablissement, pourcentage, serieParPeriode, somme, sommeDe } from "@/lib/autorite-agregats";
import { COULEURS } from "@/lib/chart-theme";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { FiltresBarre } from "@/components/autorite/filtres-barre";
import { GraphiqueBarres } from "@/components/autorite/graphiques";
import { SeriesSelectionnables } from "@/components/autorite/series-selectionnables";
import { TableauDonnees } from "@/components/autorite/tableau-donnees";
import { Barre, Formule, Provenance, SansDonnees, surtitreAutorite } from "@/components/autorite/elements";
import { IconAlertTriangle, IconCheckCircle, IconHospital, IconTarget, IconVitals, IconArchive } from "@/components/icons";

export const metadata: Metadata = {
  title: "Paludisme (PNLP1)",
  robots: { index: false, follow: false },
};

const DEF = formulaireStatistique("PNLP1")!;
const TABLEAU = DEF.blocs.find((b) => b.id === "indicateurs") as BlocTableau;
const RUPTURE = DEF.blocs.find((b) => b.id === "rupture") as BlocOuiNon;
const CLES = indicateursFormulaire(DEF).map((i) => i.cle);
const LIGNES = TABLEAU.lignes.filter((l) => !l.section);
// Section (Paludisme simple / grave) de chaque ligne, dans l'ordre du formulaire.
const SECTION: Record<string, string> = {};
{
  let courante = "";
  for (const l of TABLEAU.lignes) {
    if (l.section) courante = l.libelle;
    else SECTION[l.id] = courante;
  }
}
const libelleLigne = (id: string) => {
  const l = LIGNES.find((x) => x.id === id)!;
  return `${SECTION[id]} — ${l.libelle}`;
};
const GROUPES = [
  { id: "d5_M", libelle: "< 5 ans · M" },
  { id: "d5_F", libelle: "< 5 ans · F" },
  { id: "d5p_M", libelle: "≥ 5 ans · M" },
  { id: "d5p_F", libelle: "≥ 5 ans · F" },
  { id: "fe", libelle: "Femmes enceintes" },
];
const T = (ligne: string, col = "total") => `indicateurs.${ligne}.${col}`;
const TESTS = [
  { teste: "s_tdr", positif: "s_tdr_pos", libelle: "Simple · TDR" },
  { teste: "s_ge", positif: "s_ge_pos", libelle: "Simple · GE" },
  { teste: "g_tdr", positif: "g_tdr_pos", libelle: "Grave · TDR" },
  { teste: "g_ge", positif: "g_ge_pos", libelle: "Grave · GE" },
];

// ROADMAP_ESPACE_AUTORITES.md, étape 5.7.
export default async function PaludismePage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const { autorite, etablissements, filtres, noms } = await contexteAutorite(searchParams);
  const d = await donnees("PNLP1", CLES, filtres);
  const r = d.rapports;
  const resume = resumeFiltres(filtres, noms);
  const entete = (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Paludisme"
        description={`${DEF.titre} : diagnostic, tests, prise en charge, décès et ruptures de stock.`}
      />
      <FiltresBarre etablissements={optionsEtablissements(etablissements)} />
    </>
  );
  if (r.length === 0) return (<>{entete}<SansDonnees formulaire="PNLP1" /></>);

  const testes = sommeDe(r, TESTS.map((t) => T(t.teste)));
  const positifs = sommeDe(r, TESTS.map((t) => T(t.positif)));
  const simple = somme(r, T("s_registre"));
  const grave = somme(r, T("g_registre"));
  const deces = sommeDe(r, [T("g_deces_teste"), T("g_deces_clinique")]);
  const ctaPrescrit = somme(r, T("s_cta_prescrit"));
  const ctaPharmacie = somme(r, T("s_cta_pharmacie"));

  const tests = TESTS.map((t) => {
    const n = somme(r, T(t.teste));
    const p = somme(r, T(t.positif));
    return { libelle: t.libelle, testes: n, positifs: p, taux: pourcentage(p, n) };
  });

  const evolution = serieParPeriode(r, LIGNES.map((l) => ({ cle: l.id, cles: [T(l.id)] })));
  // Libellés abrégés pour l'axe ; le libellé complet du formulaire est dans le tableau détaillé.
  const parGroupe = [
    { id: "s_registre", libelle: "Simple notifié (registre)" },
    { id: "g_registre", libelle: "Grave notifié (registre)" },
    { id: "s_tdr_pos", libelle: "Simple · TDR positif" },
    { id: "s_ge_pos", libelle: "Simple · GE positif" },
  ].map(({ id, libelle }) => ({ libelle, ...Object.fromEntries(GROUPES.map((g) => [g.id, somme(r, T(id, g.id))])) }));

  const ruptures = RUPTURE.elements.map((e) => {
    const { oui, renseignes } = compteOui(r, `rupture.${e.id}`);
    const etabs = new Set(r.filter((x) => x.valeurs[`rupture.${e.id}`] === true).map((x) => x.organisationId)).size;
    return { id: e.id, libelle: e.libelle, oui, renseignes, etablissements: etabs };
  });

  const etabs = parEtablissement(r, [
    { cle: "testes", cles: TESTS.map((t) => T(t.teste)) },
    { cle: "positifs", cles: TESTS.map((t) => T(t.positif)) },
    { cle: "simple", cles: [T("s_registre")] },
    { cle: "grave", cles: [T("g_registre")] },
    { cle: "deces", cles: [T("g_deces_teste"), T("g_deces_clinique")] },
  ]);
  const ruptureParEtab = new Map<string, number>();
  for (const x of r) {
    const n = RUPTURE.elements.filter((e) => x.valeurs[`rupture.${e.id}`] === true).length;
    ruptureParEtab.set(x.organisationId, (ruptureParEtab.get(x.organisationId) ?? 0) + (n > 0 ? 1 : 0));
  }

  return (
    <>
      {entete}
      <Provenance formulaire="PNLP1" rapports={r.length} filtres={resume} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Cas testés (TDR + GE)" valeur={formaterNombre(testes)} sousTexte={<Formule>4 lignes « Cas testés » (simple et grave), colonne Total</Formule>} icone={IconVitals} />
        <StatCard label="Positifs" valeur={formaterNombre(positifs)} sousTexte={<Formule>positifs ÷ testés = {formaterPourcentage(pourcentage(positifs, testes))}</Formule>} icone={IconTarget} ton="warning" />
        <StatCard label="Paludisme simple notifié" valeur={formaterNombre(simple)} sousTexte="Registre de soins curatifs" icone={IconCheckCircle} ton="info" />
        <StatCard label="Paludisme grave notifié" valeur={formaterNombre(grave)} sousTexte="Registre de soins curatifs" icone={IconHospital} ton="accent" />
        <StatCard label="Décès (paludisme grave)" valeur={formaterNombre(deces)} sousTexte={<Formule>testé positif + diagnostiqué cliniquement</Formule>} icone={IconAlertTriangle} ton="danger" />
        <StatCard label="CTA" valeur={formaterNombre(ctaPrescrit)} sousTexte={`prescrits · ${formaterNombre(ctaPharmacie)} délivrés à la pharmacie du centre`} icone={IconArchive} ton="success" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader titre="Tests et positivité" description={resume} />
          <GraphiqueBarres
            donnees={tests}
            cleX="libelle"
            series={[
              { cle: "testes", label: "Testés", couleur: COULEURS.primary },
              { cle: "positifs", label: "Positifs", couleur: COULEURS.warning },
            ]}
          />
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tests.map((t) => (
              <li key={t.libelle} className="rounded-[var(--radius-md)] border border-border px-3 py-2">
                <p className="text-xs text-text-muted">{t.libelle}</p>
                <p className="font-display text-lg font-semibold tabular-nums text-text">{formaterPourcentage(t.taux)}</p>
                <Formule>positifs ÷ testés</Formule>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader titre="Répartition par groupe" description="Colonnes du formulaire : âge, sexe, femmes enceintes" />
          <GraphiqueBarres
            donnees={parGroupe}
            cleX="libelle"
            horizontal
            empile
            series={GROUPES.map((g) => ({ cle: g.id, label: g.libelle }))}
          />
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader titre="Évolution mensuelle" description="Choisissez les lignes du formulaire (colonne Total)" />
        <SeriesSelectionnables
          donnees={evolution}
          libelleChoix="Indicateurs"
          options={LIGNES.map((l) => ({ cle: l.id, label: libelleLigne(l.id) }))}
          parDefaut={["s_registre", "g_registre", "s_tdr_pos"]}
        />
      </Card>

      <Card className="mt-6">
        <CardHeader titre="Ruptures de stock (au moins 1 jour dans le mois)" description="Nombre de rapports ayant répondu « Oui »" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ruptures.map((x) => (
            <li key={x.id} className="rounded-[var(--radius-md)] border border-border p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-text">{x.libelle}</span>
                <span className="text-sm tabular-nums text-text-muted">
                  <span className="font-semibold text-text">{x.oui}</span> / {x.renseignes}
                </span>
              </div>
              <div className="mt-2">
                <Barre valeur={x.oui} max={x.renseignes} ton={x.oui > 0 ? "bg-danger" : "bg-success"} />
              </div>
              <p className="mt-2 text-xs text-text-faint">
                {x.etablissements} établissement{x.etablissements > 1 ? "s" : ""} concerné{x.etablissements > 1 ? "s" : ""} · {formaterPourcentage(pourcentage(x.oui, x.renseignes))} des rapports
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <h2 className="mb-3 mt-8 font-display text-base font-semibold text-text">Détail des indicateurs</h2>
      <TableauDonnees
        id="autorite-pnlp1-indicateurs"
        nomExport="pnlp1-indicateurs"
        recherche="Rechercher un indicateur…"
        tailleDePage={25}
        colonnes={[
          { cle: "indicateur", entete: "Indicateur" },
          { cle: "section", entete: "Section", filtre: true },
          ...GROUPES.map((g) => ({ cle: g.id, entete: g.libelle, format: "nombre" as const })),
          { cle: "total", entete: "Total", format: "nombre" as const },
        ]}
        lignes={LIGNES.map((l) => ({
          id: l.id,
          indicateur: l.libelle,
          section: SECTION[l.id],
          ...Object.fromEntries(GROUPES.map((g) => [g.id, CLES.includes(T(l.id, g.id)) ? somme(r, T(l.id, g.id)) : null])),
          total: somme(r, T(l.id)),
        }))}
      />

      <h2 className="mb-3 mt-8 font-display text-base font-semibold text-text">Par établissement</h2>
      <TableauDonnees
        id="autorite-pnlp1-etablissements"
        nomExport="pnlp1-etablissements"
        recherche="Rechercher un établissement…"
        triParDefaut={{ cle: "simple", direction: "desc" }}
        colonnes={[
          { cle: "nom", entete: "Établissement", lien: "lien" },
          { cle: "commune", entete: "Commune", filtre: true },
          { cle: "rapports", entete: "Mois transmis", format: "nombre", masqueeParDefaut: true },
          { cle: "testes", entete: "Testés", format: "nombre" },
          { cle: "positifs", entete: "Positifs", format: "nombre", masqueeParDefaut: true },
          { cle: "positivite", entete: "Positivité", format: "pourcentage" },
          { cle: "simple", entete: "Simple notifié", format: "nombre" },
          { cle: "grave", entete: "Grave notifié", format: "nombre" },
          { cle: "deces", entete: "Décès", format: "nombre" },
          { cle: "moisRupture", entete: "Mois avec rupture", format: "nombre" },
        ]}
        lignes={etabs.map((e) => ({
          id: e.id,
          lien: `/autorite/etablissements/${e.id}`,
          nom: e.nom,
          commune: e.commune,
          rapports: e.rapports,
          ...e.valeurs,
          positivite: pourcentage(e.valeurs.positifs, e.valeurs.testes),
          moisRupture: ruptureParEtab.get(e.id) ?? 0,
        }))}
      />
    </>
  );
}
