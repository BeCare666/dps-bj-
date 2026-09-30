import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { Reveal } from "@/components/motion/reveal";
import type { EtatSecurite } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Sécurité",
  robots: { index: false, follow: false },
};

async function silencieux<T>(promesse: Promise<T>, repli: T): Promise<T> {
  try {
    return await promesse;
  } catch (erreur) {
    if (erreur instanceof ApiError) return repli;
    throw erreur;
  }
}

export default async function AdminSecuritePage() {
  const etat = await silencieux(apiFetchJson<EtatSecurite>("/securite"), null);

  if (!etat) {
    return <p className="text-sm text-text-muted">Informations de sécurité indisponibles pour l&apos;instant.</p>;
  }

  return (
    <div>
      <Reveal>
        <p className="mb-6 text-sm text-text-muted">
          Informations de sécurité réellement disponibles, en lecture seule. La durée de session n&apos;est pas
          modifiable depuis cette interface, car un mauvais réglage affaiblirait la sécurité de toute la
          plateforme.
        </p>
      </Reveal>

      <Reveal delay={0.05} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Durée de session</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-text-faint">Token d&apos;accès (JWT)</p>
            <p className="font-display text-lg font-bold text-text">{etat.session.jwtAccessTtl}</p>
          </div>
          <div>
            <p className="text-xs text-text-faint">Token de rafraîchissement</p>
            <p className="font-display text-lg font-bold text-text">{etat.session.jwtRefreshTtl}</p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Limitation de débit (rate limiting)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-faint">Endpoint</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-faint">Limite</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-faint">Fenêtre</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-faint">Justification</th>
              </tr>
            </thead>
            <tbody>
              {etat.rateLimiting.map((r) => (
                <tr key={r.endpoint} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono text-xs text-text">{r.endpoint}</td>
                  <td className="px-3 py-2 text-text">{r.limite}</td>
                  <td className="px-3 py-2 text-text-muted">{r.fenetre}</td>
                  <td className="px-3 py-2 text-text-muted">{r.justification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
