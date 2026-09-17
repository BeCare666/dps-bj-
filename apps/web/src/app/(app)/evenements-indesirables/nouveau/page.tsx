import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { Reveal } from "@/components/motion/reveal";
import { DeclarerForm } from "@/components/ei/declarer-form";
import type { TypeEi } from "@/lib/types";

export const metadata: Metadata = {
  title: "Déclarer un événement indésirable",
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

export default async function DeclarerEiPage() {
  const typesEi = await silencieux(apiFetchJson<TypeEi[]>("/types-ei"), []);

  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:px-8">
      <Reveal>
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Module EI</span>
        <h1 className="mt-2 font-display text-2xl font-bold text-text">Déclarer un événement indésirable</h1>
        <p className="mt-2 text-text-muted">
          Toute personne de l&apos;organisation peut déclarer. La qualification de gravité sera faite par le
          responsable qualité.
        </p>
      </Reveal>

      <Reveal delay={0.05} className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <DeclarerForm typesEi={typesEi} />
      </Reveal>
    </div>
  );
}
