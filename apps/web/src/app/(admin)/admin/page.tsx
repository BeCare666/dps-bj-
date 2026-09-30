import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { Reveal } from "@/components/motion/reveal";
import { formaterFcfa } from "@/lib/format";
import { ReservationsParStatutChart, CatalogueChart } from "@/components/admin/dashboard-charts";
import { StatCard } from "@/components/ui/card";
import type { Formation, Reservation, StatutReservation, TypeEi } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Tableau de bord",
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

const LIBELLES_STATUT: Record<StatutReservation, string> = {
  ATTENTE_PAIEMENT: "En attente de paiement",
  PAYEE: "Payée",
  CONFIRMEE: "Confirmée",
  REALISEE: "Réalisée",
  ANNULEE: "Annulée",
};

const COULEURS_STATUT: Record<StatutReservation, string> = {
  ATTENTE_PAIEMENT: "#b5750f",
  PAYEE: "#1657cc",
  CONFIRMEE: "#1a8f5e",
  REALISEE: "#0f3d8a",
  ANNULEE: "#93999f",
};

export default async function AdminAccueilPage() {
  const [reservations, formations, typesEi] = await Promise.all([
    silencieux(apiFetchJson<Reservation[]>("/reservations"), []),
    silencieux(apiFetchJson<Formation[]>("/formations?inclureInactives=true"), []),
    silencieux(apiFetchJson<TypeEi[]>("/types-ei?inclureInactifs=true"), []),
  ]);

  const montantEncaisse = reservations
    .filter((r) => r.statut !== "ATTENTE_PAIEMENT" && r.statut !== "ANNULEE")
    .reduce((s, r) => s + r.tarifApplique, 0);

  const parStatut = (Object.keys(LIBELLES_STATUT) as StatutReservation[]).map((statut) => ({
    statut: LIBELLES_STATUT[statut],
    nombre: reservations.filter((r) => r.statut === statut).length,
    couleur: COULEURS_STATUT[statut],
  }));

  const formationsActives = formations.filter((f) => f.actif).length;
  const typesEiActifs = typesEi.filter((t) => t.actif).length;

  const donneesCatalogue = [
    { categorie: "Formations", actives: formationsActives, inactives: formations.length - formationsActives },
    { categorie: "Types d'EI", actives: typesEiActifs, inactives: typesEi.length - typesEiActifs },
  ];

  return (
    <div>
      <Reveal>
        <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Vue d&apos;ensemble</span>
        <h2 className="mt-1 font-display text-2xl font-bold text-text">Bonjour 👋</h2>
      </Reveal>

      <Reveal delay={0.05} className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Réservations" valeur={String(reservations.length)} sousTexte="tous établissements" />
        <StatCard label="Montant encaissé" valeur={formaterFcfa(montantEncaisse)} sousTexte="hors annulées/en attente" />
        <StatCard label="Formations actives" valeur={`${formationsActives} / ${formations.length}`} />
        <StatCard label="Types d'EI actifs" valeur={`${typesEiActifs} / ${typesEi.length}`} />
      </Reveal>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Reveal delay={0.1} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Réservations par statut</h3>
          <ReservationsParStatutChart donnees={parStatut} />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {parStatut.map((p) => (
              <span key={p.statut} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.couleur }} />
                {p.statut} ({p.nombre})
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Catalogue (actif / inactif)</h3>
          <CatalogueChart donnees={donneesCatalogue} />
        </Reveal>
      </div>
    </div>
  );
}
