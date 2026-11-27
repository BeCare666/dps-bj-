"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconSearch } from "@/components/icons";
import { formaterDate } from "@/lib/format";
import type { ResultatVerification, SourceEvaluation } from "@/lib/types";

const LIBELLES_SOURCE: Record<SourceEvaluation, string> = {
  AUTO_EVALUATION: "Auto-évaluation sur DSP",
  ARS: "Évaluation de l'ARS",
  MINISTERE: "Évaluation du Ministère de la Santé",
};

// Échelle ARS (manuels EH p. 55 et ESPC p. 48, tableau 8).
const DESCRIPTION_NIVEAU = [
  "Critères essentiels non tous respectés",
  "Critères essentiels respectés à 100 %",
  "Essentiels à 100 % et fondamentaux de 60 à 89 %",
  "Essentiels à 100 % et fondamentaux à 90 % ou plus",
  "Fondamentaux à 90 % ou plus et avancés à 80 % ou plus",
  "Tous les critères respectés à 100 %",
];

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 10) / 10} %`);

export function RechercheEtablissement() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qUrl = params.get("q") ?? "";
  const [saisie, setSaisie] = useState(qUrl);
  const [suggestions, setSuggestions] = useState<ResultatVerification[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [resultats, setResultats] = useState<ResultatVerification[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const idListe = useId();
  const conteneur = useRef<HTMLDivElement>(null);

  async function chercher(q: string, signal?: AbortSignal): Promise<ResultatVerification[]> {
    const res = await fetch(`/api/verification?q=${encodeURIComponent(q)}`, { signal });
    return res.ok ? res.json() : [];
  }

  // Suggestions en direct (après une courte pause de frappe).
  useEffect(() => {
    const q = saisie.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const controle = new AbortController();
    const minuterie = setTimeout(() => {
      chercher(q, controle.signal).then(setSuggestions).catch(() => {});
    }, 250);
    return () => {
      clearTimeout(minuterie);
      controle.abort();
    };
  }, [saisie]);

  // Résultats de la recherche validée (conservée dans l'URL).
  useEffect(() => {
    if (qUrl.trim().length < 2) {
      setResultats(null);
      return;
    }
    const controle = new AbortController();
    setChargement(true);
    chercher(qUrl.trim(), controle.signal)
      .then(setResultats)
      .catch(() => {})
      .finally(() => setChargement(false));
    return () => controle.abort();
  }, [qUrl]);

  useEffect(() => {
    function surClic(e: PointerEvent) {
      if (conteneur.current && !conteneur.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("pointerdown", surClic);
    return () => document.removeEventListener("pointerdown", surClic);
  }, []);

  function valider(q: string) {
    setSaisie(q);
    setOuvert(false);
    setActif(-1);
    const suivant = q.trim();
    router.replace(suivant ? `${pathname}?q=${encodeURIComponent(suivant)}` : pathname, { scroll: false });
  }

  const noms = [...new Map(suggestions.map((s) => [s.nom, s])).values()].slice(0, 8);

  return (
    <div className="mt-10">
      <div ref={conteneur} className="relative mx-auto max-w-2xl">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            valider(actif >= 0 && noms[actif] ? noms[actif].nom : saisie);
          }}
        >
          <IconSearch width={20} height={20} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            type="search"
            role="combobox"
            aria-expanded={ouvert && noms.length > 0}
            aria-controls={idListe}
            aria-autocomplete="list"
            aria-activedescendant={actif >= 0 ? `${idListe}-${actif}` : undefined}
            aria-label="Nom de l'établissement"
            autoComplete="off"
            autoFocus
            value={saisie}
            onChange={(e) => {
              setSaisie(e.target.value);
              setOuvert(true);
              setActif(-1);
            }}
            onFocus={() => setOuvert(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActif((i) => Math.min(i + 1, noms.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActif((i) => Math.max(i - 1, -1));
              } else if (e.key === "Escape") {
                setOuvert(false);
              }
            }}
            placeholder="Nom de l'hôpital, de la clinique ou du centre de santé"
            className="w-full rounded-full border border-border bg-surface py-4 pl-14 pr-28 text-base text-text shadow-[var(--shadow-card)] outline-none transition-shadow focus:border-primary focus:shadow-[var(--shadow-elevated)]"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
            Vérifier
          </button>
        </form>

        {ouvert && noms.length > 0 && (
          <ul id={idListe} role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-surface py-2 shadow-[var(--shadow-elevated)]">
            {noms.map((s, i) => (
              <li
                key={s.nom}
                id={`${idListe}-${i}`}
                role="option"
                aria-selected={actif === i}
                onPointerDown={(e) => {
                  e.preventDefault();
                  valider(s.nom);
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 px-5 py-2.5 text-sm ${actif === i ? "bg-bg-subtle" : "hover:bg-bg-subtle"}`}
              >
                <span className="text-text">{s.nom}</span>
                <span className="text-xs text-text-faint">
                  {s.typeEtablissement}
                  {s.ville ? ` · ${s.ville}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10" aria-live="polite">
        {chargement && <p className="text-center text-sm text-text-muted">Recherche…</p>}
        {!chargement && resultats && resultats.length === 0 && (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-6 py-10 text-center text-sm text-text-muted">
            Aucun établissement trouvé pour « {qUrl} ».
          </p>
        )}
        {!chargement && resultats && resultats.length > 0 && (
          <ul className="flex flex-col gap-4">
            {resultats.map((r, i) => (
              <li key={`${r.nom}-${r.source}-${r.date ?? i}`}>
                <CarteResultat resultat={r} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CarteResultat({ resultat: r }: { resultat: ResultatVerification }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-text">{r.nom}</h2>
          <p className="mt-1 text-sm text-text-muted">
            {r.typeEtablissement === "EH" ? "Établissement hospitalier" : "Établissement de soins de premier contact"}
            {r.ville ? ` · ${r.ville}` : ""}
          </p>
          <p className="mt-2 text-xs text-text-faint">
            {LIBELLES_SOURCE[r.source]}
            {r.date ? ` · ${formaterDate(r.date)}` : ""}
          </p>
        </div>
        {r.niveau !== null ? (
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-text-faint">Niveau ARS</p>
            <p className="font-display text-4xl font-bold text-primary">
              {r.niveau}
              <span className="text-lg text-text-faint">/5</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-faint">Aucune auto-évaluation complète publiée</p>
        )}
      </div>

      {r.niveau !== null && (
        <>
          <ol className="mt-5 grid grid-cols-6 gap-1.5" aria-label={`Niveau ${r.niveau} sur 5`}>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <li key={n} className="flex flex-col items-center gap-1">
                <span className={`h-2 w-full rounded-full ${n <= r.niveau! ? "bg-primary" : "bg-bg-subtle"}`} />
                <span className={`text-xs tabular-nums ${n === r.niveau ? "font-semibold text-text" : "text-text-faint"}`}>{n}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-text-muted">{DESCRIPTION_NIVEAU[r.niveau]}</p>
          {(r.pctEssentiels !== null || r.pctFondamentaux !== null || r.pctAvances !== null) && (
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
              {[
                ["Essentiels", r.pctEssentiels],
                ["Fondamentaux", r.pctFondamentaux],
                ["Avancés", r.pctAvances],
              ].map(([label, v]) => (
                <div key={label as string}>
                  <dt className="text-xs text-text-faint">{label}</dt>
                  <dd className="font-display text-base font-semibold text-text tabular-nums">{pct(v as number | null)}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </article>
  );
}
