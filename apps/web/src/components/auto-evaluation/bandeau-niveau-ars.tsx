import Link from "next/link";
import { formaterDate } from "@/lib/format";
import type { NiveauMonEtablissement } from "@/lib/types";

const SOURCES = { ARS: "l'ARS", MINISTERE: "le Ministère de la Santé" } as const;

// §11.1 — niveau sur l'échelle ARS (0 à 5) : calculé à partir des dernières
// auto-évaluations soumises, et niveau d'une évaluation officielle antérieure
// s'il est connu. Ce dernier ne pré-remplit rien (§5.4).
export function BandeauNiveauArs({ niveau }: { niveau: NiveauMonEtablissement }) {
  const auto = niveau.autoEvaluation;
  const externe = niveau.evaluationsExternes[0];
  return (
    <div className="rounded-[var(--radius-lg)] border border-primary/20 bg-primary-soft/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-faint">Niveau sur l&apos;échelle ARS</p>
          {auto.niveau !== null ? (
            <p className="mt-1 font-display text-3xl font-bold text-primary">
              {auto.niveau}
              <span className="text-base text-text-faint">/5</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-text-muted">Soumettez l&apos;auto-évaluation des critères essentiels pour obtenir un niveau.</p>
          )}
          <p className="mt-1 text-xs text-text-muted">
            Auto-évaluation DSP{auto.date ? ` · ${formaterDate(auto.date)}` : ""} · essentiels {auto.essentiels ?? "—"} %, fondamentaux{" "}
            {auto.fondamentaux ?? "—"} %, avancés {auto.avances ?? "—"} %
          </p>
        </div>
        {externe && (
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-faint">Dernière évaluation officielle</p>
            <p className="mt-1 font-display text-3xl font-bold text-text">
              {externe.niveau}
              <span className="text-base text-text-faint">/5</span>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Par {SOURCES[externe.source]} · {formaterDate(externe.dateEvaluation)}
            </p>
          </div>
        )}
      </div>
      {externe && (
        <p className="mt-4 border-t border-primary/15 pt-3 text-sm leading-6 text-text">
          Le niveau attribué par {SOURCES[externe.source]} est publié sur{" "}
          <Link href="/verifier-etablissement" className="font-medium text-primary hover:underline">
            Vérifier votre établissement
          </Link>
          . Pour poursuivre votre démarche sur DSP, refaites l&apos;auto-évaluation complète (critères essentiels,
          fondamentaux et avancés) : aucune réponse n&apos;est reprise de l&apos;évaluation officielle.
        </p>
      )}
    </div>
  );
}
