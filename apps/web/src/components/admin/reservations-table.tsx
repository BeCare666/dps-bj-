"use client";

import { useMemo, useState } from "react";
import { DataTable, type ColonneTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { StatutReservationBadge } from "@/components/reservations/badges";
import { formaterDate, formaterDateHeure, formaterFcfa } from "@/lib/format";
import { FixerDateRdvForm } from "./fixer-date-rdv-form";
import { MarquerRealiseeForm } from "./marquer-realisee-form";
import type { FormuleFormation, Reservation, StatutReservation } from "@/lib/types";

const LIBELLES_FORMULE: Record<FormuleFormation, string> = {
  INDIVIDUEL: "Individuel",
  GROUPE_5: "Groupe 5",
  GROUPE_10: "Groupe 10",
};

const OPTIONS_STATUT: { valeur: StatutReservation | ""; label: string }[] = [
  { valeur: "", label: "Tous les statuts" },
  { valeur: "ATTENTE_PAIEMENT", label: "En attente de paiement" },
  { valeur: "PAYEE", label: "Payée" },
  { valeur: "CONFIRMEE", label: "Confirmée" },
  { valeur: "REALISEE", label: "Réalisée" },
  { valeur: "ANNULEE", label: "Annulée" },
];

function nomClient(r: Reservation): string {
  if (!r.utilisateur) return "Client non renseigné";
  const nomPersonne = `${r.utilisateur.prenom} ${r.utilisateur.nom}`;
  return r.organisation ? `${r.organisation.nom} (${nomPersonne})` : nomPersonne;
}

export function ReservationsTable({ reservations }: { reservations: Reservation[] }) {
  const [filtreStatut, setFiltreStatut] = useState<StatutReservation | "">("");
  const [reservationDateRdv, setReservationDateRdv] = useState<Reservation | null>(null);
  const [reservationRealisation, setReservationRealisation] = useState<Reservation | null>(null);

  const lignesFiltrees = useMemo(
    () => (filtreStatut ? reservations.filter((r) => r.statut === filtreStatut) : reservations),
    [reservations, filtreStatut],
  );

  const colonnes: ColonneTable<Reservation>[] = [
    {
      cle: "formation",
      entete: "Formation",
      render: (r) => (
        <div>
          <p className="font-medium text-text">{r.formation?.titre ?? "Formation non renseignée"}</p>
          <p className="text-xs text-text-faint">{LIBELLES_FORMULE[r.formule]}</p>
        </div>
      ),
      valeurTri: (r) => r.formation?.titre ?? "",
      valeurRecherche: (r) => `${r.formation?.titre ?? ""} ${nomClient(r)}`,
    },
    {
      cle: "client",
      entete: "Client",
      render: (r) => <span className="text-text">{nomClient(r)}</span>,
      valeurTri: (r) => nomClient(r),
      valeurRecherche: (r) => nomClient(r),
    },
    {
      cle: "tarif",
      entete: "Tarif",
      render: (r) => formaterFcfa(r.tarifApplique),
      valeurTri: (r) => r.tarifApplique,
      alignement: "right",
    },
    {
      cle: "statut",
      entete: "Statut",
      render: (r) => <StatutReservationBadge statut={r.statut} />,
      valeurTri: (r) => r.statut,
      alignement: "center",
    },
    {
      cle: "dateRdv",
      entete: "Rendez-vous",
      render: (r) => (r.dateRdv ? formaterDateHeure(r.dateRdv) : "À planifier"),
      valeurTri: (r) => r.dateRdv ?? "",
    },
    {
      cle: "creee",
      entete: "Réservée le",
      render: (r) => formaterDate(r.createdAt),
      valeurTri: (r) => r.createdAt,
    },
    {
      cle: "actions",
      entete: "Actions",
      render: (r) => (
        <div className="flex justify-end">
          {r.statut === "PAYEE" && (
            <button
              type="button"
              onClick={() => setReservationDateRdv(r)}
              className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary/40 hover:bg-primary-soft/60"
            >
              Fixer la date RDV
            </button>
          )}
          {r.statut === "CONFIRMEE" && (
            <button
              type="button"
              onClick={() => setReservationRealisation(r)}
              className="rounded-[var(--radius-md)] border border-success/30 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success-soft"
            >
              Clôturer
            </button>
          )}
        </div>
      ),
      alignement: "right",
    },
  ];

  return (
    <div>
      <DataTable
        colonnes={colonnes}
        lignes={lignesFiltrees}
        cleLigne={(r) => r.id}
        rechercheEspaceReserve="Rechercher une formation ou un client…"
        videMessage="Aucune réservation pour ce filtre."
        filtres={
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value as StatutReservation | "")}
            className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          >
            {OPTIONS_STATUT.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.label}
              </option>
            ))}
          </select>
        }
      />

      <Modal
        open={reservationDateRdv !== null}
        onClose={() => setReservationDateRdv(null)}
        title="Fixer la date de rendez-vous"
        description={reservationDateRdv?.formation?.titre}
      >
        {reservationDateRdv && (
          <FixerDateRdvForm reservationId={reservationDateRdv.id} onSuccess={() => setReservationDateRdv(null)} />
        )}
      </Modal>

      <Modal
        open={reservationRealisation !== null}
        onClose={() => setReservationRealisation(null)}
        title="Clôturer la session"
        description={reservationRealisation?.formation?.titre}
      >
        {reservationRealisation && (
          <MarquerRealiseeForm
            reservationId={reservationRealisation.id}
            onSuccess={() => setReservationRealisation(null)}
          />
        )}
      </Modal>
    </div>
  );
}
