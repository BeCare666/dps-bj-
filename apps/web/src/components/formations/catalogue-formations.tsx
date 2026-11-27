"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { IconFilter, IconSearch } from "@/components/icons";
import { CouvertureFormation } from "@/components/formations/couverture-formation";
import {
  LIBELLES_NIVEAU,
  LIBELLES_TYPE,
  PARCOURS,
  TRANCHES_DUREE,
  TRIS,
  domainesDe,
  filtrerFormations,
  prixMinimum,
  type FiltresCatalogue,
} from "@/lib/catalogue-formations";
import { formaterFcfa } from "@/lib/format";
import type { Formation, NiveauCritere, TypeEtablissement } from "@/lib/types";

const NIVEAUX: NiveauCritere[] = ["ESSENTIEL", "FONDAMENTAL", "AVANCE"];

function lireFiltres(p: URLSearchParams): FiltresCatalogue {
  const niveau = p.get("niveau");
  return {
    type: p.get("type") === "ESPC" ? "ESPC" : "EH",
    niveau: NIVEAUX.includes(niveau as NiveauCritere) ? (niveau as NiveauCritere) : undefined,
    domaine: p.get("domaine") ?? undefined,
    parcours: p.get("parcours") ?? undefined,
    q: p.get("q") ?? undefined,
    public: p.get("public") ?? undefined,
    duree: p.get("duree") ?? undefined,
    tri: p.get("tri") ?? undefined,
  };
}

const puce = (actif: boolean) =>
  `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
    actif ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text"
  }`;

const champ =
  "w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary";

export function CatalogueFormations({ formations }: { formations: Formation[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, demarrer] = useTransition();
  const filtres = lireFiltres(params);
  const [avances, setAvances] = useState(Boolean(filtres.public || filtres.duree));
  const [recherche, setRecherche] = useState(filtres.q ?? "");

  // Filtres conservés dans l'URL (partage, retour arrière).
  function modifier(changements: Record<string, string | undefined>) {
    const suivant = new URLSearchParams(params);
    for (const [cle, valeur] of Object.entries(changements)) {
      if (valeur) suivant.set(cle, valeur);
      else suivant.delete(cle);
    }
    const qs = suivant.toString();
    demarrer(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  const resultats = useMemo(() => filtrerFormations(formations, filtres), [formations, params]); // eslint-disable-line react-hooks/exhaustive-deps
  const domaines = useMemo(() => domainesDe(formations, filtres.type), [formations, filtres.type]);
  const autres = useMemo(() => formations.filter((f) => !f.typeEtablissement), [formations]);
  const parType = (t: TypeEtablissement) => formations.filter((f) => f.typeEtablissement === t).length;
  const filtresActifs = Boolean(filtres.niveau || filtres.domaine || filtres.parcours || filtres.q || filtres.public || filtres.duree);

  return (
    <div>
      {/* Onglets EH / ESPC */}
      <div role="tablist" aria-label="Type d'établissement" className="flex flex-wrap gap-2 border-b border-border">
        {(["EH", "ESPC"] as const).map((t) => {
          const actif = filtres.type === t;
          return (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={actif}
              onClick={() => modifier({ type: t === "EH" ? undefined : t, domaine: undefined, parcours: undefined })}
              className={`-mb-px border-b-2 px-4 pb-3 pt-1 text-left text-sm font-semibold transition-colors ${
                actif ? "border-primary text-text" : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {LIBELLES_TYPE[t]}
              <span className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-medium text-text-faint">{parType(t)}</span>
            </button>
          );
        })}
      </div>

      {/* Recherche, tri, filtres avancés */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          role="search"
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            modifier({ q: recherche.trim() || undefined });
          }}
        >
          <IconSearch width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              if (e.target.value === "") modifier({ q: undefined });
            }}
            onBlur={() => modifier({ q: recherche.trim() || undefined })}
            placeholder="Rechercher une formation, un critère (ex. C.2.1.1), un thème…"
            aria-label="Rechercher une formation"
            className={`${champ} pl-9`}
          />
        </form>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <span className="whitespace-nowrap">Trier par</span>
          <select value={filtres.tri ?? "critere"} onChange={(e) => modifier({ tri: e.target.value === "critere" ? undefined : e.target.value })} className={champ}>
            {TRIS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.libelle}
              </option>
            ))}
          </select>
        </label>
        <button type="button" aria-expanded={avances} onClick={() => setAvances(!avances)} className={`${puce(avances)} inline-flex items-center gap-2`}>
          <IconFilter width={15} height={15} />
          Filtres avancés
        </button>
      </div>

      {avances && (
        <div className="mt-3 grid gap-3 rounded-[var(--radius-lg)] border border-border bg-bg-subtle p-4 sm:grid-cols-3">
          <label className="text-sm text-text-muted">
            Public
            <input
              type="text"
              defaultValue={filtres.public ?? ""}
              onBlur={(e) => modifier({ public: e.target.value.trim() || undefined })}
              onKeyDown={(e) => e.key === "Enter" && modifier({ public: e.currentTarget.value.trim() || undefined })}
              placeholder="ex. infirmiers, sages-femmes"
              className={`${champ} mt-1`}
            />
          </label>
          <label className="text-sm text-text-muted">
            Durée
            <select value={filtres.duree ?? ""} onChange={(e) => modifier({ duree: e.target.value || undefined })} className={`${champ} mt-1`}>
              <option value="">Toutes</option>
              {TRANCHES_DUREE.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.libelle}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Catégories : niveau, domaine, parcours */}
      <div className="mt-6 grid gap-4">
        <GroupePuces titre="Niveau du critère">
          <button type="button" className={puce(!filtres.niveau)} onClick={() => modifier({ niveau: undefined })}>
            Tous
          </button>
          {NIVEAUX.filter((n) => formations.some((f) => f.typeEtablissement === filtres.type && f.niveau === n)).map((n) => (
            <button key={n} type="button" className={puce(filtres.niveau === n)} onClick={() => modifier({ niveau: n })}>
              {LIBELLES_NIVEAU[n]}
            </button>
          ))}
        </GroupePuces>
        <GroupePuces titre="Domaine">
          <button type="button" className={puce(!filtres.domaine)} onClick={() => modifier({ domaine: undefined })}>
            Tous
          </button>
          {domaines.map((d) => (
            <button key={d.code} type="button" title={d.nom} className={puce(filtres.domaine === d.code)} onClick={() => modifier({ domaine: d.code })}>
              {d.code} · {d.nom}
            </button>
          ))}
        </GroupePuces>
        {filtres.type === "EH" && (
          <label className="flex flex-col gap-1 text-sm text-text-muted sm:max-w-md">
            Parcours
            <select value={filtres.parcours ?? ""} onChange={(e) => modifier({ parcours: e.target.value || undefined })} className={champ}>
              <option value="">Toutes les formations</option>
              {PARCOURS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-text-muted" aria-live="polite">
          {resultats.length} formation{resultats.length > 1 ? "s" : ""}
        </p>
        {filtresActifs && (
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => {
              setRecherche("");
              modifier({ niveau: undefined, domaine: undefined, parcours: undefined, q: undefined, public: undefined, duree: undefined });
            }}
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {resultats.length === 0 ? (
        <p className="mt-4 rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-6 py-10 text-center text-sm text-text-muted">
          Aucune formation ne correspond à ces critères.
        </p>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resultats.map((f) => (
            <li key={f.id}>
              <CarteFormation formation={f} />
            </li>
          ))}
        </ul>
      )}

      {/* Formations créées dans l'admin hors catalogue officiel (sans type). */}
      {autres.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-text">Autres formations DSP</h2>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {autres.map((f) => (
              <li key={f.id}>
                <CarteFormation formation={f} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function GroupePuces({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-faint">{titre}</p>
      <div className="scrollbar-fin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{children}</div>
    </div>
  );
}

function CarteFormation({ formation: f }: { formation: Formation }) {
  const prix = prixMinimum(f);
  const prochaine = f.sessions?.[0];
  return (
    <Link
      href={`/formations/${f.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[var(--shadow-card)]"
    >
      <div className="h-36 shrink-0">
        <CouvertureFormation formation={f} className="transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-text-faint">
          {f.niveau && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-primary">{LIBELLES_NIVEAU[f.niveau]}</span>}
          {f.dureeLibelle && <span>{f.dureeLibelle}</span>}
        </div>
        <h2 className="mt-2 font-display text-base font-semibold leading-snug text-text">{f.titre}</h2>
        {f.publicCible && <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">{f.publicCible}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-text-faint">À partir de</span>
            <p className="font-display text-lg font-bold text-primary">
              {formaterFcfa(prix)} <span className="text-xs font-medium text-text-muted">/ personne</span>
            </p>
          </div>
          {prochaine && (
            <span className="text-right text-xs text-text-muted">
              Prochaine session
              <br />
              {new Date(prochaine.debut).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Africa/Porto-Novo" })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
