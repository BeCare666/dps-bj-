"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown";
import { IconCalendar, IconCheck, IconClose, IconFilter, IconSearch } from "@/components/icons";
import {
  LIBELLES_STRUCTURE,
  RACCOURCIS_PERIODE,
  STATUTS_FILTRE,
  lireFiltres,
  type RaccourciPeriode,
} from "@/lib/autorite-filtres";

// Barre de filtres commune de l'espace des autorités (ROADMAP_ESPACE_AUTORITES.md,
// étape 4.2). Chaque changement met à jour l'URL ; la page serveur recharge
// les données filtrées par l'API.

export interface EtablissementFiltre {
  id: string;
  nom: string;
  commune: string | null;
  typeStructure: string | null;
}

interface Option {
  valeur: string;
  libelle: string;
  detail?: string;
}

export function MultiSelection({
  libelle,
  options,
  choisis,
  onChange,
  recherche = false,
}: {
  libelle: string;
  options: Option[];
  choisis: string[];
  onChange: (valeurs: string[]) => void;
  recherche?: boolean;
}) {
  const [q, setQ] = useState("");
  const visibles = q.trim()
    ? options.filter((o) => `${o.libelle} ${o.detail ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    : options;
  const basculer = (v: string) => onChange(choisis.includes(v) ? choisis.filter((x) => x !== v) : [...choisis, v]);
  return (
    <Dropdown
      align="left"
      className="w-[min(20rem,calc(100vw-2rem))]"
      trigger={({ ouvert, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={ouvert}
          className={`inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-sm font-medium transition-colors ${
            choisis.length
              ? "border-primary/30 bg-primary-soft text-primary"
              : "border-dashed border-border text-text-muted hover:border-text-faint hover:text-text"
          }`}
        >
          <IconFilter width={15} height={15} />
          {libelle}
          {choisis.length > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[0.6875rem] font-semibold text-primary-foreground tabular-nums">
              {choisis.length}
            </span>
          )}
        </button>
      )}
    >
      <div className="p-1.5">
        <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-text-faint">{libelle}</p>
        {recherche && (
          <label className="relative mx-1 mb-1.5 block">
            <span className="sr-only">Rechercher</span>
            <IconSearch width={14} height={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className="h-8 w-full rounded-[var(--radius-sm)] border border-border bg-bg-subtle/60 pl-8 pr-2 text-sm text-text focus:border-primary focus:outline-none"
            />
          </label>
        )}
        <div className="scrollbar-fin max-h-72 overflow-y-auto">
          {visibles.length === 0 && <p className="px-2.5 py-3 text-sm text-text-faint">Aucun résultat.</p>}
          {visibles.map((o) => {
            const coche = choisis.includes(o.valeur);
            return (
              <button
                key={o.valeur}
                type="button"
                role="menuitemcheckbox"
                aria-checked={coche}
                onClick={() => basculer(o.valeur)}
                className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm text-text transition-colors hover:bg-bg-subtle"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
                    coche ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"
                  }`}
                >
                  {coche && <IconCheck width={12} height={12} strokeWidth={2.4} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.libelle}</span>
                  {o.detail && <span className="block truncate text-xs text-text-faint">{o.detail}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-border px-2.5 pb-1 pt-2.5 text-xs font-medium">
          <button type="button" onClick={() => onChange(options.map((o) => o.valeur))} className="text-text-muted hover:text-text">
            Tout cocher
          </button>
          {choisis.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="text-text-muted hover:text-text">
              Effacer
            </button>
          )}
        </div>
      </div>
    </Dropdown>
  );
}

function Puce({ libelle, onRetirer }: { libelle: string; onRetirer: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-surface py-1 pl-3 pr-1 text-xs font-medium text-text">
      <span className="truncate">{libelle}</span>
      <button
        type="button"
        onClick={onRetirer}
        aria-label={`Retirer : ${libelle}`}
        className="rounded-full p-0.5 text-text-faint transition-colors hover:bg-bg-subtle hover:text-text"
      >
        <IconClose width={12} height={12} />
      </button>
    </span>
  );
}

const CLASSE_CHAMP =
  "h-9 rounded-[var(--radius-md)] border border-border bg-surface px-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft";

export function FiltresBarre({
  etablissements,
  raccourciParDefaut = "12m",
  avecStatut = true,
  avecPeriode = true,
  children,
}: {
  etablissements: EtablissementFiltre[];
  raccourciParDefaut?: RaccourciPeriode;
  avecStatut?: boolean;
  avecPeriode?: boolean;
  // Filtres propres à la page (même barre, même URL).
  children?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [enCours, demarrer] = useTransition();
  const filtres = lireFiltres(Object.fromEntries(params.entries()), raccourciParDefaut);

  const communes = useMemo(
    () => [...new Set(etablissements.map((e) => e.commune).filter((c): c is string => Boolean(c)))].sort((a, b) => a.localeCompare(b, "fr")),
    [etablissements],
  );
  const structures = useMemo(
    () => [...new Set(etablissements.map((e) => e.typeStructure).filter((s): s is string => Boolean(s)))],
    [etablissements],
  );
  const noms = useMemo(() => Object.fromEntries(etablissements.map((e) => [e.id, e.nom])), [etablissements]);

  function appliquer(modifs: Record<string, string | null>) {
    const suivant = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(modifs)) {
      if (v) suivant.set(k, v);
      else suivant.delete(k);
    }
    const chaine = suivant.toString();
    demarrer(() => router.push(`${pathname}${chaine ? `?${chaine}` : ""}`, { scroll: false }));
  }

  const liste = (v: string[]) => (v.length ? v.join(",") : null);
  const actifs =
    filtres.etablissements.length + filtres.communes.length + filtres.structures.length + (filtres.statut ? 1 : 0);

  return (
    <div className={`mb-6 rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-card)] transition-opacity ${enCours ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
        {avecPeriode && (
          <label className="relative inline-flex items-center">
            <span className="sr-only">Période</span>
            <IconCalendar width={15} height={15} className="pointer-events-none absolute left-2.5 text-text-faint" />
            <select
              value={filtres.raccourci}
              onChange={(e) => {
                const r = e.target.value as RaccourciPeriode;
                appliquer({ periode: r === raccourciParDefaut ? null : r, du: r === "perso" ? filtres.du : null, au: r === "perso" ? filtres.au : null });
              }}
              className={`${CLASSE_CHAMP} pl-8 pr-7`}
            >
              {RACCOURCIS_PERIODE.map((r) => (
                <option key={r.valeur} value={r.valeur}>
                  {r.libelle}
                </option>
              ))}
            </select>
          </label>
        )}
        {avecPeriode && filtres.raccourci === "perso" && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-text-muted">
              Du
              <input type="date" value={filtres.du ?? ""} onChange={(e) => appliquer({ periode: "perso", du: e.target.value || null })} className={CLASSE_CHAMP} />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-text-muted">
              au
              <input type="date" value={filtres.au ?? ""} onChange={(e) => appliquer({ periode: "perso", au: e.target.value || null })} className={CLASSE_CHAMP} />
            </label>
          </div>
        )}
        <MultiSelection
          libelle="Établissements"
          recherche
          options={etablissements.map((e) => ({ valeur: e.id, libelle: e.nom, detail: e.commune ?? undefined }))}
          choisis={filtres.etablissements}
          onChange={(v) => appliquer({ etab: liste(v) })}
        />
        {communes.length > 0 && (
          <MultiSelection
            libelle="Communes"
            options={communes.map((c) => ({ valeur: c, libelle: c }))}
            choisis={filtres.communes}
            onChange={(v) => appliquer({ commune: liste(v) })}
          />
        )}
        {structures.length > 0 && (
          <MultiSelection
            libelle="Type de structure"
            options={structures.map((s) => ({ valeur: s, libelle: LIBELLES_STRUCTURE[s] ?? s }))}
            choisis={filtres.structures}
            onChange={(v) => appliquer({ structure: liste(v) })}
          />
        )}
        {avecStatut && (
          <select
            value={filtres.statut ?? ""}
            onChange={(e) => appliquer({ statut: e.target.value || null })}
            aria-label="Statut des rapports"
            className={CLASSE_CHAMP}
          >
            <option value="">Soumis et validés</option>
            {STATUTS_FILTRE.map((s) => (
              <option key={s.valeur} value={s.valeur}>
                {s.libelle}
              </option>
            ))}
          </select>
        )}
        {children}
        {enCours && <span className="ml-auto text-xs text-text-faint">Mise à jour…</span>}
      </div>
      {actifs > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-bg-subtle/40 px-3 py-2.5 sm:px-4">
          {filtres.etablissements.map((id) => (
            <Puce key={id} libelle={noms[id] ?? "Établissement"} onRetirer={() => appliquer({ etab: liste(filtres.etablissements.filter((x) => x !== id)) })} />
          ))}
          {filtres.communes.map((c) => (
            <Puce key={c} libelle={`Commune : ${c}`} onRetirer={() => appliquer({ commune: liste(filtres.communes.filter((x) => x !== c)) })} />
          ))}
          {filtres.structures.map((s) => (
            <Puce key={s} libelle={LIBELLES_STRUCTURE[s] ?? s} onRetirer={() => appliquer({ structure: liste(filtres.structures.filter((x) => x !== s)) })} />
          ))}
          {filtres.statut && (
            <Puce libelle={STATUTS_FILTRE.find((s) => s.valeur === filtres.statut)!.libelle} onRetirer={() => appliquer({ statut: null })} />
          )}
          <button
            type="button"
            onClick={() => appliquer({ etab: null, commune: null, structure: null, statut: null })}
            className="ml-auto text-xs font-medium text-text-muted transition-colors hover:text-text"
          >
            Tout réinitialiser
          </button>
        </div>
      )}
    </div>
  );
}

// Sélecteur propre à une page (formulaire, regroupement…), écrit dans l'URL.
export function SelecteurUrl({
  parametre,
  libelle,
  options,
  valeur,
  valeurParDefaut,
}: {
  parametre: string;
  libelle: string;
  options: Option[];
  valeur: string;
  valeurParDefaut?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, demarrer] = useTransition();
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <span className="hidden sm:inline">{libelle}</span>
      <select
        aria-label={libelle}
        value={valeur}
        onChange={(e) => {
          const suivant = new URLSearchParams(params.toString());
          if (e.target.value && e.target.value !== valeurParDefaut) suivant.set(parametre, e.target.value);
          else suivant.delete(parametre);
          const chaine = suivant.toString();
          demarrer(() => router.push(`${pathname}${chaine ? `?${chaine}` : ""}`, { scroll: false }));
        }}
        className={`${CLASSE_CHAMP} max-w-[16rem]`}
      >
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}
