"use client";

import Link from "next/link";
import { DataTable, type ColonneTable } from "@/components/ui/data-table";
import { formaterDateHeure } from "@/lib/format";
import type { LigneAlertePlateforme } from "@/lib/types";

const STYLES_NIVEAU: Record<string, string> = {
  ELEVE: "bg-danger-soft text-danger",
  MOYEN: "bg-warning-soft text-warning",
};

const LIBELLES_STATUT: Record<string, string> = {
  OUVERTE: "Ouverte",
  EN_COURS: "En cours",
  DECLARE: "Déclaré",
  EN_TRAITEMENT: "En traitement",
};

export function AlertesTable({ lignes }: { lignes: LigneAlertePlateforme[] }) {
  const colonnes: ColonneTable<LigneAlertePlateforme>[] = [
    {
      cle: "organisation",
      entete: "Établissement",
      render: (l) => (
        <Link href={`/admin/etablissements/${l.organisationId}`} className="font-medium text-text hover:text-primary hover:underline">
          {l.organisationNom}
        </Link>
      ),
      valeurTri: (l) => l.organisationNom,
      valeurRecherche: (l) => l.organisationNom,
    },
    {
      cle: "source",
      entete: "Module",
      render: (l) => (l.source === "NEWS" ? "Score NEWS" : "Événement indésirable"),
      valeurTri: (l) => l.source,
    },
    {
      cle: "niveau",
      entete: "Niveau",
      render: (l) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES_NIVEAU[l.niveau] ?? "bg-bg-subtle text-text-faint"}`}>
          {l.niveau === "ELEVE" ? "Élevé" : l.niveau === "MOYEN" ? "Moyen" : l.niveau}
        </span>
      ),
      valeurTri: (l) => l.niveau,
    },
    {
      cle: "statut",
      entete: "Statut",
      render: (l) => LIBELLES_STATUT[l.statut] ?? l.statut,
      valeurTri: (l) => l.statut,
    },
    {
      cle: "nombre",
      entete: "Nombre",
      render: (l) => <span className="font-display font-bold text-text">{l.nombre}</span>,
      valeurTri: (l) => l.nombre,
      alignement: "right",
    },
    {
      cle: "depuis",
      entete: "La plus ancienne depuis",
      render: (l) => formaterDateHeure(l.depuisLe),
      valeurTri: (l) => l.depuisLe,
    },
  ];

  return (
    <DataTable
      colonnes={colonnes}
      lignes={lignes}
      cleLigne={(l) => `${l.organisationId}-${l.source}-${l.niveau}-${l.statut}`}
      rechercheEspaceReserve="Rechercher un établissement…"
      videMessage="Aucune alerte ouverte pour l'instant."
    />
  );
}
