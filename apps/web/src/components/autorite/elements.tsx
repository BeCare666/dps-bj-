import Link from "next/link";
import type { ReactNode } from "react";
import { libelleDepartement, LIBELLES_NIVEAU_AUTORITE } from "@/lib/rapports-statistiques-libelles";
import type { AutoriteSanitaire } from "@/lib/types";

// Éléments communs des pages de l'espace des autorités (ROADMAP_ESPACE_AUTORITES.md).

export function ressortAutorite(a: AutoriteSanitaire): string {
  if (a.niveau === "NATIONAL") return "tous les départements";
  if (a.niveau === "DEPARTEMENT") return `département ${libelleDepartement(a.departement)}`;
  return `zone sanitaire ${a.zoneSanitaire ?? "—"} (${libelleDepartement(a.departement)})`;
}

export function surtitreAutorite(a: AutoriteSanitaire): string {
  return LIBELLES_NIVEAU_AUTORITE[a.niveau];
}

// Formule d'un chiffre calculé, affichée à côté du chiffre (aucun indicateur caché).
export function Formule({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-start gap-1 text-[0.6875rem] leading-4 text-text-faint">
      <span aria-hidden className="font-semibold italic">ƒ</span>
      <span>{children}</span>
    </span>
  );
}

// Provenance des chiffres d'une page : formulaire, nombre de rapports, filtres.
export function Provenance({ formulaire, rapports, filtres }: { formulaire: string; rapports: number; filtres: string }) {
  return (
    <p className="mb-6 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-xs leading-5 text-text-muted">
      Chiffres calculés à partir de <span className="font-semibold text-text">{rapports} rapport{rapports > 1 ? "s" : ""}</span>{" "}
      « {formulaire} » soumis ou validés{filtres ? ` (${filtres})` : ""}. Les totaux sont des sommes des cases du formulaire ;
      une case vide compte pour zéro.
    </p>
  );
}

export function SansDonnees({ formulaire }: { formulaire: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-6 py-14 text-center">
      <p className="text-sm font-semibold text-text">Aucun rapport « {formulaire} » pour ces filtres</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">
        Élargissez la période ou retirez des filtres. Les rapports apparaissent dès qu&apos;un établissement du ressort les soumet.
      </p>
      <Link href="?periode=tout" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        Voir toutes les périodes
      </Link>
    </div>
  );
}

export function Barre({ valeur, max, ton = "bg-primary" }: { valeur: number; max: number; ton?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((valeur / max) * 100)) : 0;
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
      <span className={`block h-full rounded-full ${ton}`} style={{ width: `${pct}%` }} />
    </span>
  );
}
