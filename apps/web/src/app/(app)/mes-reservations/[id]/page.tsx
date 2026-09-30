import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDate, formaterDateHeure, formaterFcfa } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { StatutReservationBadge } from "@/components/reservations/badges";
import { KkiapayButton } from "@/components/reservations/kkiapay-button";
import { AnnulerReservationButton } from "@/components/reservations/annuler-reservation-button";
import type { FormuleFormation, Reservation } from "@/lib/types";

const LIBELLES_FORMULE: Record<FormuleFormation, string> = {
  INDIVIDUEL: "Individuel",
  GROUPE_5: "Groupe de 5",
  GROUPE_10: "Groupe de 10",
};

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let reservation: Reservation;
  try {
    reservation = await apiFetchJson<Reservation>(`/reservations/${id}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  const peutAnnuler = reservation.statut !== "REALISEE" && reservation.statut !== "ANNULEE";

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <Reveal>
        <Link href="/mes-reservations" className="text-sm font-medium text-text-muted hover:text-text">
          ← Mes réservations
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-text">{reservation.formation?.titre ?? "Formation"}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {LIBELLES_FORMULE[reservation.formule]} · réservée le {formaterDate(reservation.createdAt)}
            </p>
          </div>
          <StatutReservationBadge statut={reservation.statut} />
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Montant</span>
          <span className="font-display text-xl font-bold text-text">{formaterFcfa(reservation.tarifApplique)}</span>
        </div>

        {reservation.statut === "ATTENTE_PAIEMENT" && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="mb-3 text-sm text-text-muted">Réglez pour confirmer votre place.</p>
            <KkiapayButton reservationId={reservation.id} montant={reservation.tarifApplique} />
          </div>
        )}

        {reservation.statut === "PAYEE" && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-text-muted">
              Paiement confirmé{reservation.facture ? ` (facture ${reservation.facture.numero})` : ""}. La date de
              rendez-vous vous sera communiquée sous 48h.
            </p>
          </div>
        )}

        {reservation.statut === "CONFIRMEE" && reservation.dateRdv && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-text-muted">Rendez-vous le</p>
            <p className="font-display text-lg font-bold text-primary">{formaterDateHeure(reservation.dateRdv)}</p>
          </div>
        )}

        {reservation.statut === "REALISEE" && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-success">
              Session réalisée{reservation.presenceConfirmee ? ", présence confirmée" : ""}.
            </p>
          </div>
        )}

        {reservation.statut === "ANNULEE" && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm text-text-faint">Cette réservation a été annulée.</p>
          </div>
        )}
      </Reveal>

      {peutAnnuler && (
        <Reveal delay={0.1} className="mt-6">
          <AnnulerReservationButton reservationId={reservation.id} />
        </Reveal>
      )}
    </div>
  );
}
