import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { Reveal } from "@/components/motion/reveal";
import { ParametreForm } from "@/components/admin/parametre-form";
import type { ParametrePlateforme } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Paramètres",
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

export default async function AdminParametresPage() {
  const parametres = await silencieux(apiFetchJson<ParametrePlateforme[]>("/parametres"), []);

  return (
    <div>
      <Reveal>
        <p className="mb-6 text-sm text-text-muted">
          Paramètres appliqués à l&apos;ensemble de la plateforme. Chaque modification est enregistrée dans le
          journal d&apos;audit.
        </p>
      </Reveal>

      <div className="flex flex-col gap-4">
        {parametres.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-5 py-8 text-center text-sm text-text-muted">
            Aucun paramètre disponible.
          </p>
        ) : (
          parametres.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <ParametreForm parametre={p} />
            </Reveal>
          ))
        )}
      </div>
    </div>
  );
}
