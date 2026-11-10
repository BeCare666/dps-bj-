"use client";

import Link from "next/link";
import { useState } from "react";
import { IconSearch } from "@/components/icons";
import { libellePeriodeCourt } from "@/lib/autorite-agregats";
import type { TransmissionsAutorite } from "@/lib/types";

// Matrice établissement × période (ROADMAP_ESPACE_AUTORITES.md, étape 5.3).
// Une case : validé, soumis (à valider) ou non reçu. Clic → le rapport.

const STYLES = {
  VALIDE: "bg-success text-white",
  SOUMIS: "bg-warning/85 text-white",
  NON_RECU: "bg-bg-subtle text-text-faint border border-dashed border-border",
} as const;

const dateHeure = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function MatriceTransmissions({ donnees }: { donnees: TransmissionsAutorite }) {
  const [q, setQ] = useState("");
  const [incomplets, setIncomplets] = useState(false);
  const n = donnees.periodes.length;

  const lignes = donnees.etablissements
    .map((e) => ({ ...e, transmis: donnees.periodes.filter((p) => e.cellules[p]).length }))
    .filter((e) => (!q.trim() || `${e.nom} ${e.commune ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) && (!incomplets || e.transmis < n));

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative w-full sm:w-64">
            <span className="sr-only">Rechercher un établissement</span>
            <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un établissement…"
              className="h-9 w-full rounded-[var(--radius-md)] border border-border bg-bg-subtle/60 pl-9 pr-3 text-sm text-text focus:border-primary focus:bg-surface focus:outline-none"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-text-muted">
            <input type="checkbox" checked={incomplets} onChange={(e) => setIncomplets(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
            Seulement les établissements avec des périodes manquantes
          </label>
        </div>
        <ul className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <li className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-[3px] ${STYLES.VALIDE}`} />Validé</li>
          <li className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-[3px] ${STYLES.SOUMIS}`} />Soumis, à valider</li>
          <li className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-[3px] ${STYLES.NON_RECU}`} />Non reçu</li>
        </ul>
      </div>

      <div className="scrollbar-fin overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-[2] min-w-[12rem] border-b border-border bg-surface px-4 py-2.5 text-left text-xs font-semibold text-text-muted sm:min-w-[16rem]">
                Établissement
              </th>
              {donnees.periodes.map((p) => (
                <th key={p} scope="col" className="whitespace-nowrap border-b border-border px-1 py-2.5 text-center text-[0.6875rem] font-semibold text-text-muted">
                  {libellePeriodeCourt(p)}
                </th>
              ))}
              <th scope="col" className="border-b border-border px-3 py-2.5 text-right text-xs font-semibold text-text-muted">Transmis</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr>
                <td colSpan={n + 2} className="px-4 py-10 text-center text-sm text-text-muted">
                  Aucun établissement ne correspond.
                </td>
              </tr>
            )}
            {lignes.map((e) => (
              <tr key={e.id} className="group">
                <th scope="row" className="sticky left-0 z-[1] border-b border-border bg-surface px-4 py-2 text-left font-normal group-hover:bg-bg-subtle">
                  <Link href={`/autorite/etablissements/${e.id}`} className="block max-w-[14rem] truncate font-medium text-text hover:text-primary sm:max-w-[18rem]">
                    {e.nom}
                  </Link>
                  <span className="block text-xs text-text-faint">
                    {e.commune ?? "Commune non renseignée"}
                    {!e.localiseDansRessort && " · localisé hors ressort"}
                  </span>
                </th>
                {donnees.periodes.map((p) => {
                  const c = e.cellules[p];
                  const titre = c
                    ? `${libellePeriodeCourt(p)} — ${c.statut === "VALIDE" ? "validé" : "soumis"} le ${c.soumisLe ? dateHeure.format(new Date(c.statut === "VALIDE" && c.valideLe ? c.valideLe : c.soumisLe)) : "—"}`
                    : `${libellePeriodeCourt(p)} — non reçu`;
                  return (
                    <td key={p} className="border-b border-border px-1 py-2 text-center group-hover:bg-bg-subtle/60">
                      {c ? (
                        <Link
                          href={`/autorite/rapports/${c.id}`}
                          title={titre}
                          aria-label={titre}
                          className={`mx-auto block h-6 w-6 rounded-[5px] transition-transform hover:scale-110 sm:h-7 sm:w-7 ${STYLES[c.statut === "VALIDE" ? "VALIDE" : "SOUMIS"]}`}
                        />
                      ) : (
                        <span title={titre} aria-label={titre} className={`mx-auto block h-6 w-6 rounded-[5px] sm:h-7 sm:w-7 ${STYLES.NON_RECU}`} />
                      )}
                    </td>
                  );
                })}
                <td className="border-b border-border px-3 py-2 text-right tabular-nums text-text-muted group-hover:bg-bg-subtle/60">
                  <span className={e.transmis === n ? "font-semibold text-success" : "text-text"}>{e.transmis}</span> / {n}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
