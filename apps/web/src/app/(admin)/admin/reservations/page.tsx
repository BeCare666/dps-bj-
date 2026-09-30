import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { ReservationsTable } from "@/components/admin/reservations-table";
import type { Reservation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Réservations",
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

export default async function AdminReservationsPage() {
  const reservations = await silencieux(apiFetchJson<Reservation[]>("/reservations"), []);

  return (
    <div>
      <p className="mb-6 text-sm text-text-muted">
        {reservations.length} réservation{reservations.length > 1 ? "s" : ""} tous établissements confondus.
      </p>
      <ReservationsTable reservations={reservations} />
    </div>
  );
}
