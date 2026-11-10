import type { Metadata } from "next";
import { FORMULAIRES_STATISTIQUES, formulaireStatistique, indicateursFormulaire } from "@dps/shared";
import { contexteAutorite, donnees, optionsEtablissements } from "@/lib/autorite-serveur";
import { resumeFiltres, type ParametresUrl } from "@/lib/autorite-filtres";
import { formaterNombre, libellePeriodeCourt } from "@/lib/autorite-agregats";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { FiltresBarre } from "@/components/autorite/filtres-barre";
import { ExplorateurControles, ExplorateurGraphique } from "@/components/autorite/explorateur-controles";
import { TableauDonnees } from "@/components/autorite/tableau-donnees";
import { Formule, surtitreAutorite } from "@/components/autorite/elements";

export const metadata: Metadata = {
  title: "Explorateur d'indicateurs",
  robots: { index: false, follow: false },
};

const REGROUPEMENTS = [
  { valeur: "periode", libelle: "Période" },
  { valeur: "etablissement", libelle: "Établissement" },
  { valeur: "commune", libelle: "Commune" },
  { valeur: "ligne", libelle: "Ligne du formulaire (total)" },
];
const GRAPHIQUES = [
  { valeur: "barres", libelle: "Barres" },
  { valeur: "empile", libelle: "Barres empilées" },
  { valeur: "barres-h", libelle: "Barres horizontales" },
  { valeur: "empile-h", libelle: "Barres horizontales empilées" },
  { valeur: "courbes", libelle: "Courbes" },
  { valeur: "aires", libelle: "Aires" },
];
const MAX_LIGNES = 12;

function un(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// ROADMAP_ESPACE_AUTORITES.md, étape 5.10 — n'importe quelle case de
// n'importe quel formulaire (catalogue `indicateursFormulaire`), regroupée
// par période, établissement, commune ou ligne.
export default async function ExplorateurPage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const { params, autorite, etablissements, filtres, noms } = await contexteAutorite(searchParams);

  const def = formulaireStatistique(un(params.formulaire) ?? "") ?? FORMULAIRES_STATISTIQUES[0];
  const indicateurs = indicateursFormulaire(def);
  const blocs = [...new Map(indicateurs.map((i) => [i.blocId, i.bloc])).entries()].map(([valeur, libelle]) => ({ valeur, libelle }));
  const bloc = blocs.find((b) => b.valeur === un(params.bloc))?.valeur ?? blocs[0].valeur;
  const duBloc = indicateurs.filter((i) => i.blocId === bloc);
  const estTableau = duBloc.some((i) => i.ligneId);

  // Lignes et colonnes du bloc ; pour un bloc Oui/Non ou de champs, une « ligne » est un élément.
  const lignes = estTableau
    ? [...new Map(duBloc.map((i) => [i.ligneId!, i.ligne!])).entries()].map(([valeur, libelle]) => ({ valeur, libelle }))
    : duBloc.map((i) => ({ valeur: i.cle.split(".")[1], libelle: i.libelle ?? i.cle }));
  const colonnes = estTableau
    ? [...new Map(duBloc.map((i) => [i.colonneId!, i.colonne!.join(" › ")])).entries()].map(([valeur, libelle]) => ({ valeur, libelle }))
    : [];
  // Par défaut : la dernière colonne de total du tableau (ex. « Total général »), sinon la dernière.
  const colonneTotal = [...colonnes].reverse().find((c) => /total/i.test(c.libelle))?.valeur;
  const colonne = colonnes.find((c) => c.valeur === un(params.colonne))?.valeur ?? colonneTotal ?? colonnes.at(-1)?.valeur ?? "";

  const demande = un(params.lignes);
  const lignesChoisies = (
    demande === "aucune" ? [] : demande ? demande.split(",").filter((l) => lignes.some((x) => x.valeur === l)) : lignes.slice(0, 5).map((l) => l.valeur)
  ).slice(0, MAX_LIGNES);
  const regroupement = REGROUPEMENTS.find((r) => r.valeur === un(params.par))?.valeur ?? "periode";
  const graphique = GRAPHIQUES.find((g) => g.valeur === un(params.graphique))?.valeur ?? (regroupement === "periode" ? "courbes" : "barres");

  // Indicateur d'une ligne choisie (case existante uniquement : une case hachurée n'est pas proposée).
  const valides = new Set(indicateurs.map((i) => i.cle));
  const choix = lignesChoisies
    .map((l) => ({ ligne: l, cle: estTableau ? `${bloc}.${l}.${colonne}` : `${bloc}.${l}`, libelle: lignes.find((x) => x.valeur === l)!.libelle }))
    .filter((c) => valides.has(c.cle));
  const ouiNon = duBloc[0]?.nature === "oui_non";
  const ignorees = lignesChoisies.length - choix.length;

  const d = choix.length ? await donnees(def.code, choix.map((c) => c.cle), filtres) : { rapports: [] };
  const valeur = (v: number | boolean | null | undefined) => (typeof v === "number" ? v : v === true ? 1 : 0);

  let lignesTableau: Record<string, string | number>[] = [];
  let series = choix.map((c, i) => ({ cle: `s${i}`, label: c.libelle }));
  if (regroupement === "ligne") {
    series = [{ cle: "s0", label: ouiNon ? "Rapports « Oui »" : "Total" }];
    lignesTableau = choix.map((c) => ({ x: c.libelle, s0: d.rapports.reduce((t, r) => t + valeur(r.valeurs[c.cle]), 0) }));
  } else {
    const cleGroupe = (r: (typeof d.rapports)[number]) =>
      regroupement === "periode" ? r.periode : regroupement === "etablissement" ? r.organisationNom : (r.commune ?? "Non renseignée");
    const groupes = [...new Set(d.rapports.map(cleGroupe))].sort((a, b) => a.localeCompare(b, "fr"));
    lignesTableau = groupes.map((g) => {
      const siens = d.rapports.filter((r) => cleGroupe(r) === g);
      return {
        x: regroupement === "periode" ? libellePeriodeCourt(g) : g,
        ...Object.fromEntries(choix.map((c, i) => [`s${i}`, Math.round(siens.reduce((t, r) => t + valeur(r.valeurs[c.cle]), 0) * 100) / 100])),
      };
    });
  }
  const totalGeneral = lignesTableau.reduce((t, l) => t + series.reduce((s, x) => s + (Number(l[x.cle]) || 0), 0), 0);
  const libelleColonne = colonnes.find((c) => c.valeur === colonne)?.libelle;
  const libelleX = REGROUPEMENTS.find((r) => r.valeur === regroupement)!.libelle;

  return (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Explorateur d'indicateurs"
        description="Choisissez un formulaire, un tableau, des lignes et une colonne : chaque chiffre est une case du formulaire, additionnée sur les rapports filtrés."
      />
      <FiltresBarre etablissements={optionsEtablissements(etablissements)} />

      <Card>
        <ExplorateurControles
          formulaires={FORMULAIRES_STATISTIQUES.map((f) => ({ valeur: f.code, libelle: f.titre }))}
          formulaire={def.code}
          blocs={blocs}
          bloc={bloc}
          lignes={lignes}
          lignesChoisies={lignesChoisies}
          colonnes={colonnes}
          colonne={colonne}
          regroupements={REGROUPEMENTS}
          regroupement={regroupement}
          graphiques={GRAPHIQUES}
          graphique={graphique}
        />
        <div className="mt-4 flex flex-col gap-1">
          <Formule>
            {ouiNon ? "nombre de rapports ayant répondu « Oui »" : `somme de la case${libelleColonne ? ` « ${libelleColonne} »` : ""} sur ${d.rapports.length} rapport${d.rapports.length > 1 ? "s" : ""}`}
            {resumeFiltres(filtres, noms) ? ` · ${resumeFiltres(filtres, noms)}` : ""}
          </Formule>
          {ignorees > 0 && (
            <p className="text-xs text-warning">
              {ignorees} ligne{ignorees > 1 ? "s" : ""} sans case dans cette colonne (case hachurée ou fusionnée sur le formulaire) : non affichée{ignorees > 1 ? "s" : ""}.
            </p>
          )}
          {lignesChoisies.length >= MAX_LIGNES && <p className="text-xs text-text-faint">{MAX_LIGNES} lignes au maximum.</p>}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader titre={`${blocs.find((b) => b.valeur === bloc)?.libelle} — par ${libelleX.toLowerCase()}`} description={`Total : ${formaterNombre(totalGeneral)}`} />
        {choix.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-faint">Choisissez au moins une ligne disponible dans cette colonne.</p>
        ) : (
          <ExplorateurGraphique donnees={lignesTableau} series={series} graphique={graphique} />
        )}
      </Card>

      <div className="mt-6">
        <TableauDonnees
          id="autorite-explorateur"
          nomExport={`explorateur-${def.code.toLowerCase()}-${bloc}`}
          recherche="Rechercher…"
          tailleDePage={25}
          colonnes={[
            { cle: "x", entete: libelleX },
            ...series.map((s) => ({ cle: s.cle, entete: s.label, format: "nombre" as const })),
          ]}
          lignes={lignesTableau.map((l, i) => ({ id: String(i), ...l }))}
          vide={{ titre: "Aucune donnée", description: "Aucun rapport ne correspond aux filtres choisis." }}
        />
      </div>
    </>
  );
}
