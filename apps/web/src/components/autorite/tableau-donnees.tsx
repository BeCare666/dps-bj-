"use client";

import Link from "next/link";
import { DataTable, type ColonneTable, type FiltreTable } from "@/components/ui/data-table";

// Tableau des espaces autorités (ROADMAP_ESPACE_AUTORITES.md) : colonnes
// décrites par des données (sérialisables depuis une page serveur), rendu par
// DataTable (recherche, filtres à facettes, tri, colonnes, export CSV, cartes
// mobiles).

export type FormatCellule = "texte" | "nombre" | "pourcentage" | "date";

export interface ColonneDonnees {
  cle: string;
  entete: string;
  format?: FormatCellule;
  // Colonne de lien : l'URL est lue dans la clé indiquée de la ligne.
  lien?: string;
  masqueeParDefaut?: boolean;
  // Facette de filtre construite à partir des valeurs distinctes de la colonne.
  filtre?: boolean;
  // Clé de la ligne utilisée pour le tri (ex. date de début d'une période
  // affichée en toutes lettres).
  tri?: string;
}

export type LigneDonnees = Record<string, string | number | null> & { id: string };

const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function formater(v: string | number | null, format: FormatCellule = "texte"): string {
  if (v === null || v === undefined || v === "") return "—";
  if (format === "nombre" && typeof v === "number") return nombre.format(v);
  if (format === "pourcentage" && typeof v === "number") return `${nombre.format(v)} %`;
  if (format === "date" && typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : date.format(d);
  }
  return String(v);
}

export function TableauDonnees({
  id,
  colonnes,
  lignes,
  nomExport,
  recherche = "Rechercher…",
  tailleDePage = 10,
  triParDefaut,
  vide,
  lienLigne,
}: {
  id: string;
  colonnes: ColonneDonnees[];
  lignes: LigneDonnees[];
  nomExport?: string;
  recherche?: string;
  tailleDePage?: number;
  triParDefaut?: { cle: string; direction: "asc" | "desc" };
  vide?: { titre: string; description?: string };
  // Clé de la ligne contenant l'URL de détail (clic sur la ligne).
  lienLigne?: string;
}) {
  const cols: ColonneTable<LigneDonnees>[] = colonnes.map((c, i) => {
    const numerique = c.format === "nombre" || c.format === "pourcentage";
    return {
      cle: c.cle,
      entete: c.entete,
      alignement: numerique ? "right" : "left",
      masquable: i !== 0,
      masqueeParDefaut: c.masqueeParDefaut,
      valeurTri: (l) => {
        if (c.tri) return l[c.tri] ?? "";
        const v = l[c.cle];
        if (v === null || v === undefined) return numerique ? -Infinity : "";
        return c.format === "date" && typeof v === "string" ? new Date(v).getTime() : v;
      },
      valeurRecherche: numerique ? undefined : (l) => String(l[c.cle] ?? ""),
      valeurExport: (l) => {
        const v = l[c.cle];
        return v === null || v === undefined ? "" : v;
      },
      render: (l) => {
        const texte = formater(l[c.cle], c.format);
        const href = c.lien ? (l[c.lien] as string | null) : null;
        if (href) {
          return (
            <Link href={href} className="font-medium text-text hover:text-primary hover:underline">
              {texte}
            </Link>
          );
        }
        return <span className={`${numerique ? "tabular-nums" : ""} ${i === 0 ? "font-medium text-text" : "text-text-muted"}`}>{texte}</span>;
      },
    };
  });

  const filtres: FiltreTable<LigneDonnees>[] = colonnes
    .filter((c) => c.filtre)
    .map((c) => ({
      cle: c.cle,
      label: c.entete,
      options: [...new Set(lignes.map((l) => l[c.cle]).filter((v) => v !== null && v !== ""))]
        .map(String)
        .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }))
        .map((v) => ({ valeur: v, label: v })),
      valeur: (l) => (l[c.cle] === null ? null : String(l[c.cle])),
    }));

  return (
    <DataTable
      id={id}
      colonnes={cols}
      lignes={lignes}
      cleLigne={(l) => l.id}
      rechercheEspaceReserve={recherche}
      filtres={filtres}
      exportCsv={nomExport ? { nomFichier: nomExport } : undefined}
      tailleDePage={tailleDePage}
      triParDefaut={triParDefaut}
      vide={vide}
      lienLigne={lienLigne ? (l) => (l[lienLigne] as string | null) ?? undefined : undefined}
      synchroniserUrl={false}
      // En-têtes longs (libellés des formulaires) : sur plusieurs lignes, sans débordement de la page.
      entetesMultilignes
    />
  );
}
