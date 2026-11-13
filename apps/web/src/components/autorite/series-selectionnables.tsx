"use client";

import { useState } from "react";
import { GraphiqueBarres, GraphiqueCourbes, PALETTE } from "./graphiques";
import { MultiSelection } from "./filtres-barre";

// Évolution de séries choisies par l'utilisateur parmi toutes les lignes d'un
// formulaire (ROADMAP_ESPACE_AUTORITES.md, étape 5) : choix des séries, type
// de graphique (courbes, aires, barres, barres empilées).

type Type = "courbes" | "aires" | "barres" | "empile";

const TYPES: { valeur: Type; libelle: string }[] = [
  { valeur: "courbes", libelle: "Courbes" },
  { valeur: "aires", libelle: "Aires" },
  { valeur: "barres", libelle: "Barres" },
  { valeur: "empile", libelle: "Barres empilées" },
];

export function SeriesSelectionnables({
  donnees,
  options,
  parDefaut,
  libelleChoix = "Séries",
  maximum = 10,
}: {
  donnees: Record<string, string | number>[];
  options: { cle: string; label: string }[];
  parDefaut: string[];
  libelleChoix?: string;
  maximum?: number;
}) {
  const [choisis, setChoisis] = useState(parDefaut);
  const [type, setType] = useState<Type>("courbes");
  const series = choisis
    .slice(0, maximum)
    .map((cle) => options.find((o) => o.cle === cle))
    .filter((o): o is { cle: string; label: string } => Boolean(o))
    // Couleur selon le rang parmi les séries choisies (au plus `maximum`) : deux
    // séries affichées n'ont jamais la même couleur, quel que soit leur rang dans
    // le catalogue (avant : rang dans le catalogue modulo la palette → doublons).
    .map((o, i) => ({ ...o, couleur: PALETTE[i % PALETTE.length] }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <MultiSelection
          libelle={libelleChoix}
          recherche={options.length > 8}
          options={options.map((o) => ({ valeur: o.cle, libelle: o.label }))}
          choisis={choisis}
          onChange={(v) => setChoisis(v.slice(0, maximum))}
        />
        <div role="radiogroup" aria-label="Type de graphique" className="inline-flex rounded-[var(--radius-md)] bg-bg-subtle p-1">
          {TYPES.map((t) => (
            <button
              key={t.valeur}
              type="button"
              role="radio"
              aria-checked={type === t.valeur}
              onClick={() => setType(t.valeur)}
              className={`rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors ${
                type === t.valeur ? "bg-surface text-text shadow-[var(--shadow-card)]" : "text-text-muted hover:text-text"
              }`}
            >
              {t.libelle}
            </button>
          ))}
        </div>
        {choisis.length >= maximum && <span className="text-xs text-text-faint">{maximum} séries au maximum</span>}
      </div>
      {series.length === 0 ? (
        <p className="flex h-40 items-center justify-center text-sm text-text-faint">Choisissez au moins une série.</p>
      ) : type === "courbes" || type === "aires" ? (
        <GraphiqueCourbes donnees={donnees} cleX="libelle" series={series} aire={type === "aires"} />
      ) : (
        <GraphiqueBarres donnees={donnees} cleX="libelle" series={series} empile={type === "empile"} />
      )}
    </div>
  );
}
