import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { Reveal } from "@/components/motion/reveal";
import type { EtatIntegration, StatutIntegration } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Intégrations",
  robots: { index: false, follow: false },
};

const STYLES_STATUT: Record<StatutIntegration, string> = {
  verifie_ok: "bg-success-soft text-success",
  verifie_erreur: "bg-danger-soft text-danger",
  configure: "bg-primary-soft text-primary",
  non_configure: "bg-bg-subtle text-text-faint",
};

const LIBELLES_STATUT: Record<StatutIntegration, string> = {
  verifie_ok: "Vérifié en direct : opérationnel",
  verifie_erreur: "Vérifié en direct : en erreur",
  configure: "Configuré (non vérifié en direct)",
  non_configure: "Non configuré",
};

async function silencieux<T>(promesse: Promise<T>, repli: T): Promise<T> {
  try {
    return await promesse;
  } catch (erreur) {
    if (erreur instanceof ApiError) return repli;
    throw erreur;
  }
}

export default async function AdminIntegrationsPage() {
  const etats = await silencieux(apiFetchJson<EtatIntegration[]>("/integrations"), []);

  return (
    <div>
      <Reveal>
        <p className="mb-6 text-sm text-text-muted">
          État des services externes utilisés par la plateforme. La base de données est vérifiée par une requête
          réelle ; les autres services sont vérifiés par présence de configuration (pas d&apos;appel réseau déclenché
          depuis cette page).
        </p>
      </Reveal>

      <div className="flex flex-col gap-3">
        {etats.map((e, i) => (
          <Reveal
            key={e.nom}
            delay={i * 0.05}
            className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <div>
              <p className="font-medium text-text">{e.nom}</p>
              <p className="mt-1 text-xs text-text-muted">{e.details}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES_STATUT[e.statut]}`}>
              {LIBELLES_STATUT[e.statut]}
            </span>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
