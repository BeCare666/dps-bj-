import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { apiFetchJson } from "@/lib/api-server";
import { PHOTOS } from "@/lib/site-config";
import { PhotoCredit } from "@/components/marketing/photo-credit";
import { CatalogueFormations } from "@/components/formations/catalogue-formations";
import type { Formation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Formations",
  description:
    "Catalogue des formations exigées par les manuels ARS de sécurité des patients (EH et ESPC), en sessions en ligne, en individuel ou en groupe.",
};

async function obtenirFormations(): Promise<Formation[]> {
  try {
    return await apiFetchJson<Formation[]>("/formations");
  } catch {
    return [];
  }
}

export default async function FormationsPage() {
  const formations = await obtenirFormations();
  const photo = PHOTOS.sageFemme;

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-navy-deep">
        <Image src={photo.src} alt={photo.alt} fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-deep via-navy-deep/85 to-navy-deep/30" />
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Catalogue</span>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold text-white sm:text-5xl">Formations</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/80">
            Les formations exigées par les manuels ARS de sécurité des patients, critère par critère, pour les
            établissements hospitaliers et les établissements de soins de premier contact. Sessions en ligne, en
            individuel ou en groupe.
          </p>
        </div>
        <PhotoCredit photo={photo} className="bottom-3 right-3" />
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        {formations.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-subtle px-6 py-10 text-center text-sm text-text-muted">
            Aucune formation disponible pour le moment. Revenez bientôt.
          </p>
        ) : (
          <Suspense>
            <CatalogueFormations formations={formations} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
