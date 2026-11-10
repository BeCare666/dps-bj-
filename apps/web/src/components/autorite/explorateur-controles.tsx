"use client";

import { useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MultiSelection } from "./filtres-barre";
import { GraphiqueBarres, GraphiqueCourbes } from "./graphiques";

// Explorateur d'indicateurs (ROADMAP_ESPACE_AUTORITES.md, étape 5.10) :
// choix écrits dans l'URL, calcul fait par la page serveur.

interface Option {
  valeur: string;
  libelle: string;
}

const CLASSE =
  "h-9 max-w-full rounded-[var(--radius-md)] border border-border bg-surface px-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft";

export function ExplorateurControles({
  formulaires,
  formulaire,
  blocs,
  bloc,
  lignes,
  lignesChoisies,
  colonnes,
  colonne,
  regroupements,
  regroupement,
  graphiques,
  graphique,
}: {
  formulaires: Option[];
  formulaire: string;
  blocs: Option[];
  bloc: string;
  lignes: Option[];
  lignesChoisies: string[];
  colonnes: Option[];
  colonne: string;
  regroupements: Option[];
  regroupement: string;
  graphiques: Option[];
  graphique: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [enCours, demarrer] = useTransition();

  function appliquer(modifs: Record<string, string | null>) {
    const suivant = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(modifs)) {
      if (v) suivant.set(k, v);
      else suivant.delete(k);
    }
    demarrer(() => router.push(`${pathname}?${suivant.toString()}`, { scroll: false }));
  }

  const champ = (libelle: string, enfant: ReactNode) => (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-text-muted">
      {libelle}
      {enfant}
    </label>
  );

  return (
    <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-3 ${enCours ? "opacity-70" : ""}`}>
      {champ(
        "Formulaire",
        <select className={CLASSE} value={formulaire} onChange={(e) => appliquer({ formulaire: e.target.value, bloc: null, lignes: null, colonne: null })}>
          {formulaires.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.libelle}
            </option>
          ))}
        </select>,
      )}
      {champ(
        "Tableau / rubrique",
        <select className={CLASSE} value={bloc} onChange={(e) => appliquer({ bloc: e.target.value, lignes: null, colonne: null })}>
          {blocs.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.libelle}
            </option>
          ))}
        </select>,
      )}
      {colonnes.length > 0 &&
        champ(
          "Colonne",
          <select className={CLASSE} value={colonne} onChange={(e) => appliquer({ colonne: e.target.value })}>
            {colonnes.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.libelle}
              </option>
            ))}
          </select>,
        )}
      {champ(
        `Lignes (${lignesChoisies.length} / ${lignes.length})`,
        <div>
          <MultiSelection
            libelle="Choisir les lignes"
            recherche={lignes.length > 8}
            options={lignes}
            choisis={lignesChoisies}
            onChange={(v) => appliquer({ lignes: v.length ? v.join(",") : "aucune" })}
          />
        </div>,
      )}
      {champ(
        "Regrouper par",
        <select className={CLASSE} value={regroupement} onChange={(e) => appliquer({ par: e.target.value })}>
          {regroupements.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.libelle}
            </option>
          ))}
        </select>,
      )}
      {champ(
        "Graphique",
        <select className={CLASSE} value={graphique} onChange={(e) => appliquer({ graphique: e.target.value })}>
          {graphiques.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.libelle}
            </option>
          ))}
        </select>,
      )}
    </div>
  );
}

export function ExplorateurGraphique({
  donnees,
  series,
  graphique,
}: {
  donnees: Record<string, string | number>[];
  series: { cle: string; label: string }[];
  graphique: string;
}) {
  if (graphique === "courbes") return <GraphiqueCourbes donnees={donnees} cleX="x" series={series} />;
  if (graphique === "aires") return <GraphiqueCourbes donnees={donnees} cleX="x" series={series} aire />;
  return (
    <GraphiqueBarres
      donnees={donnees}
      cleX="x"
      series={series}
      empile={graphique === "empile" || graphique === "empile-h"}
      horizontal={graphique === "barres-h" || graphique === "empile-h"}
    />
  );
}
