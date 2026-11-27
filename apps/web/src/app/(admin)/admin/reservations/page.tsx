import type { Metadata } from "next";
import { apiFetchJson, silencieux } from "@/lib/api-server";
import { ReservationsTable } from "@/components/admin/reservations-table";
import type { Reservation, SessionFormation } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Administration · Réservations",
  robots: { index: false, follow: false },
};

export default async function AdminReservationsPage() {
  const [reservations, sessions] = await Promise.all([
    silencieux(apiFetchJson<Reservation[]>("/reservations"), []),
    silencieux(apiFetchJson<SessionFormation[]>("/sessions-formation?statut=PLANIFIEE"), []),
  ]);

  return (
    <div>
      <PageHeader
        surtitre="Opérations"
        titre="Réservations"
        description={`${reservations.length} réservation${reservations.length > 1 ? "s" : ""} tous établissements confondus.`}
      />
      <ReservationsTable reservations={reservations} sessions={sessions} />
    </div>
  );
}
