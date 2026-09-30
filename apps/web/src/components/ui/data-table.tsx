"use client";

import { useMemo, useState, type ReactNode } from "react";

export interface ColonneTable<T> {
  cle: string;
  entete: string;
  render: (ligne: T) => ReactNode;
  valeurTri?: (ligne: T) => string | number;
  valeurRecherche?: (ligne: T) => string;
  alignement?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  colonnes: ColonneTable<T>[];
  lignes: T[];
  cleLigne: (ligne: T) => string;
  rechercheEspaceReserve?: string;
  filtres?: ReactNode;
  tailleDePage?: number;
  videMessage?: string;
}

const ALIGNEMENTS: Record<NonNullable<ColonneTable<unknown>["alignement"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  colonnes,
  lignes,
  cleLigne,
  rechercheEspaceReserve = "Rechercher…",
  filtres,
  tailleDePage = 10,
  videMessage = "Aucune donnée pour l'instant.",
}: DataTableProps<T>) {
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<{ cle: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const lignesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return lignes;
    return lignes.filter((ligne) => colonnes.some((c) => c.valeurRecherche?.(ligne).toLowerCase().includes(q)));
  }, [lignes, recherche, colonnes]);

  const lignesTriees = useMemo(() => {
    if (!tri) return lignesFiltrees;
    const colonne = colonnes.find((c) => c.cle === tri.cle);
    if (!colonne?.valeurTri) return lignesFiltrees;
    const copie = [...lignesFiltrees];
    copie.sort((a, b) => {
      const va = colonne.valeurTri!(a);
      const vb = colonne.valeurTri!(b);
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return tri.direction === "asc" ? cmp : -cmp;
    });
    return copie;
  }, [lignesFiltrees, tri, colonnes]);

  const totalPages = Math.max(1, Math.ceil(lignesTriees.length / tailleDePage));
  const pageCourante = Math.min(page, totalPages);
  const lignesPage = lignesTriees.slice((pageCourante - 1) * tailleDePage, pageCourante * tailleDePage);

  function basculerTri(cle: string) {
    setTri((precedent) => {
      if (!precedent || precedent.cle !== cle) return { cle, direction: "asc" };
      if (precedent.direction === "asc") return { cle, direction: "desc" };
      return null;
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={recherche}
          onChange={(e) => {
            setRecherche(e.target.value);
            setPage(1);
          }}
          placeholder={rechercheEspaceReserve}
          className="w-full max-w-xs rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2 text-sm text-text placeholder:text-text-faint transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
        />
        {filtres && <div className="flex flex-wrap items-center gap-2">{filtres}</div>}
      </div>

      <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-subtle/60">
              {colonnes.map((c) => (
                <th
                  key={c.cle}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-faint ${ALIGNEMENTS[c.alignement ?? "left"]}`}
                >
                  {c.valeurTri ? (
                    <button
                      type="button"
                      onClick={() => basculerTri(c.cle)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-text"
                    >
                      {c.entete}
                      {tri?.cle === c.cle && <span>{tri.direction === "asc" ? "↑" : "↓"}</span>}
                    </button>
                  ) : (
                    c.entete
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignesPage.length === 0 ? (
              <tr>
                <td colSpan={colonnes.length} className="px-4 py-10 text-center text-sm text-text-muted">
                  {videMessage}
                </td>
              </tr>
            ) : (
              lignesPage.map((ligne) => (
                <tr key={cleLigne(ligne)} className="border-b border-border transition-colors last:border-0 hover:bg-bg-subtle/40">
                  {colonnes.map((c) => (
                    <td key={c.cle} className={`px-4 py-3 align-middle ${ALIGNEMENTS[c.alignement ?? "left"]}`}>
                      {c.render(ligne)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lignesTriees.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {pageCourante} sur {totalPages} · {lignesTriees.length} résultat{lignesTriees.length > 1 ? "s" : ""}
          </span>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pageCourante === 1}
                onClick={() => setPage(pageCourante - 1)}
                className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 transition-colors hover:border-primary/40 disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={pageCourante === totalPages}
                onClick={() => setPage(pageCourante + 1)}
                className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 transition-colors hover:border-primary/40 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
