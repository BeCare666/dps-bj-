"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXE, COULEURS, STYLE_INFOBULLE } from "@/lib/chart-theme";

// Graphiques des tableaux de bord des autorités (ROADMAP_ESPACE_AUTORITES.md).
// Couleurs issues de lib/chart-theme.ts ; clic sur une entrée de légende pour
// masquer / afficher la série ; libellés d'axe raccourcis selon la largeur.

export const PALETTE = [
  COULEURS.primary,
  COULEURS.accent,
  COULEURS.success,
  COULEURS.warning,
  COULEURS.navy,
  COULEURS.info,
  COULEURS.danger,
  COULEURS.neutre,
  "#7a5af5",
  "#0f9fb0",
];

export interface Serie {
  cle: string;
  label: string;
  couleur?: string;
}

type Point = Record<string, string | number | null>;

const formateur = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
// Graduations d'axe : « 20 k » plutôt qu'un nombre coupé par la largeur de l'axe.
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
const formaterAxe = (v: number) => compact.format(v);
// Largeur de l'axe vertical : 44 px coupait « 4,5 k » (notation compacte fr-FR).
const LARGEUR_AXE_Y = 52;
const formaterValeur = (v: unknown) => (typeof v === "number" ? formateur.format(v) : String(v ?? "—"));

function useLargeur<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largeur, setLargeur] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(([e]) => setLargeur(e.contentRect.width));
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, largeur };
}

function tronquer(texte: string, max: number): string {
  return texte.length > max ? `${texte.slice(0, Math.max(1, max - 1))}…` : texte;
}

function Vide({ hauteur, message }: { hauteur: number; message?: string }) {
  return (
    <p className="flex items-center justify-center text-center text-sm text-text-faint" style={{ height: hauteur }}>
      {message ?? "Aucune donnée pour les filtres choisis."}
    </p>
  );
}

function estVide(donnees: Point[], series: Serie[]): boolean {
  return donnees.length === 0 || donnees.every((d) => series.every((s) => !d[s.cle]));
}

function useSeriesMasquees() {
  const [masquees, setMasquees] = useState<string[]>([]);
  const basculer = (cle: string) => setMasquees((m) => (m.includes(cle) ? m.filter((x) => x !== cle) : [...m, cle]));
  return { masquees, basculer };
}

function legende(series: Serie[], masquees: string[], basculer: (cle: string) => void): ReactNode {
  if (series.length < 2) return null;
  return (
    <Legend
      wrapperStyle={{ fontSize: 12, cursor: "pointer", paddingTop: 8 }}
      onClick={(e) => {
        const cle = (e as { dataKey?: unknown }).dataKey;
        if (typeof cle === "string") basculer(cle);
      }}
      formatter={(valeur, entree) => {
        const cle = (entree as { dataKey?: unknown }).dataKey;
        const masque = typeof cle === "string" && masquees.includes(cle);
        return <span style={{ color: masque ? COULEURS.neutre : COULEURS.texteMuted, textDecoration: masque ? "line-through" : undefined }}>{valeur}</span>;
      }}
    />
  );
}

export function GraphiqueBarres({
  donnees,
  cleX,
  series,
  horizontal = false,
  empile = false,
  hauteur,
  vide,
}: {
  donnees: Point[];
  cleX: string;
  series: Serie[];
  horizontal?: boolean;
  empile?: boolean;
  hauteur?: number;
  vide?: string;
}) {
  const { ref, largeur } = useLargeur<HTMLDivElement>();
  const { masquees, basculer } = useSeriesMasquees();
  const h = hauteur ?? (horizontal ? Math.max(220, donnees.length * (series.length > 1 && !empile ? 34 : 28) + 60) : 300);
  if (estVide(donnees, series)) return <Vide hauteur={Math.min(h, 240)} message={vide} />;

  const largeurLibelles = horizontal ? Math.min(240, Math.max(96, Math.round(largeur * 0.36))) : 0;
  const caracteres = Math.max(10, Math.floor(largeurLibelles / 6.6));
  return (
    <div ref={ref} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height={h}>
        <BarChart
          data={donnees}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 12, left: horizontal ? 0 : -12, bottom: 0 }}
          barCategoryGap={horizontal ? 6 : "18%"}
        >
          <CartesianGrid stroke={COULEURS.bordure} strokeDasharray="3 3" horizontal={!horizontal} vertical={horizontal} />
          {/* Axes enfants directs du graphique : Recharts 2 ne lit pas l'intérieur des fragments. */}
          <XAxis
            type={horizontal ? "number" : "category"}
            dataKey={horizontal ? undefined : cleX}
            allowDecimals={false}
            tick={AXE.tick}
            axisLine={horizontal ? false : AXE.ligne}
            tickLine={false}
            minTickGap={8}
            tickFormatter={horizontal ? formaterAxe : undefined}
          />
          <YAxis
            type={horizontal ? "category" : "number"}
            dataKey={horizontal ? cleX : undefined}
            allowDecimals={false}
            width={horizontal ? largeurLibelles : LARGEUR_AXE_Y}
            tick={AXE.tick}
            axisLine={horizontal ? AXE.ligne : false}
            tickLine={false}
            interval={horizontal ? 0 : "preserveEnd"}
            tickFormatter={horizontal ? (v: string) => tronquer(String(v), caracteres) : formaterAxe}
          />
          <Tooltip contentStyle={STYLE_INFOBULLE} formatter={formaterValeur} cursor={{ fill: COULEURS.primarySoft, opacity: 0.6 }} />
          {legende(series, masquees, basculer)}
          {series.map((s, i) => (
            <Bar
              key={s.cle}
              dataKey={s.cle}
              name={s.label}
              fill={s.couleur ?? PALETTE[i % PALETTE.length]}
              stackId={empile ? "pile" : undefined}
              hide={masquees.includes(s.cle)}
              radius={empile ? 0 : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={horizontal ? 18 : 42}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraphiqueCourbes({
  donnees,
  cleX,
  series,
  hauteur = 300,
  aire = false,
  vide,
}: {
  donnees: Point[];
  cleX: string;
  series: Serie[];
  hauteur?: number;
  aire?: boolean;
  vide?: string;
}) {
  const { masquees, basculer } = useSeriesMasquees();
  if (estVide(donnees, series)) return <Vide hauteur={Math.min(hauteur, 240)} message={vide} />;
  const Graphique = aire ? AreaChart : LineChart;
  return (
    <ResponsiveContainer width="100%" height={hauteur}>
      <Graphique data={donnees} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={COULEURS.bordure} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={cleX} tick={AXE.tick} axisLine={AXE.ligne} tickLine={false} minTickGap={12} />
        <YAxis allowDecimals={false} tick={AXE.tick} axisLine={false} tickLine={false} width={LARGEUR_AXE_Y} tickFormatter={formaterAxe} />
        <Tooltip contentStyle={STYLE_INFOBULLE} formatter={formaterValeur} />
        {legende(series, masquees, basculer)}
        {series.map((s, i) => {
          const couleur = s.couleur ?? PALETTE[i % PALETTE.length];
          return aire ? (
            <Area
              key={s.cle}
              type="monotone"
              dataKey={s.cle}
              name={s.label}
              stroke={couleur}
              fill={couleur}
              fillOpacity={0.12}
              strokeWidth={2}
              hide={masquees.includes(s.cle)}
            />
          ) : (
            <Line
              key={s.cle}
              type="monotone"
              dataKey={s.cle}
              name={s.label}
              stroke={couleur}
              strokeWidth={2}
              dot={donnees.length <= 24 ? { r: 2.5 } : false}
              hide={masquees.includes(s.cle)}
            />
          );
        })}
      </Graphique>
    </ResponsiveContainer>
  );
}

export interface PartAnneau {
  label: string;
  valeur: number;
  couleur?: string;
}

export function GraphiqueAnneau({ donnees, unite, vide }: { donnees: PartAnneau[]; unite: string; vide?: string }) {
  const total = donnees.reduce((s, d) => s + d.valeur, 0);
  if (total === 0) return <Vide hauteur={208} message={vide} />;
  const avecCouleur = donnees.map((d, i) => ({ ...d, couleur: d.couleur ?? PALETTE[i % PALETTE.length] }));
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={avecCouleur.filter((d) => d.valeur > 0)}
              dataKey="valeur"
              nameKey="label"
              innerRadius={66}
              outerRadius={96}
              paddingAngle={2}
              strokeWidth={0}
              cornerRadius={4}
            >
              {avecCouleur
                .filter((d) => d.valeur > 0)
                .map((d) => (
                  <Cell key={d.label} fill={d.couleur} />
                ))}
            </Pie>
            <Tooltip contentStyle={STYLE_INFOBULLE} formatter={formaterValeur} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-text tabular-nums">{formateur.format(total)}</span>
          <span className="text-xs text-text-faint">{unite}</span>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-2.5">
        {avecCouleur.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-text-muted">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.couleur }} />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-text tabular-nums">
              {formateur.format(d.valeur)}
              <span className="ml-1.5 text-xs font-normal text-text-faint">{Math.round((d.valeur / total) * 100)} %</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
