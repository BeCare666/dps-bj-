"use client";

import { useState } from "react";
import { DataTable, type ColonneTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { formaterDateHeure } from "@/lib/format";
import type { JournalAuditEntry } from "@/lib/types";

const LIBELLES_ACTION: Record<string, string> = {
  connexion: "Connexion",
  deconnexion: "Déconnexion",
  "etablissement.activer": "Établissement activé",
  "etablissement.desactiver": "Établissement désactivé",
  "utilisateur.desactiver": "Utilisateur désactivé",
  "utilisateur.reactiver": "Utilisateur réactivé",
  "utilisateur.role.ajouter": "Rôle ajouté",
  "utilisateur.role.retirer": "Rôle retiré",
};

export function AuditTable({ entrees }: { entrees: JournalAuditEntry[] }) {
  const [selection, setSelection] = useState<JournalAuditEntry | null>(null);

  const colonnes: ColonneTable<JournalAuditEntry>[] = [
    {
      cle: "date",
      entete: "Date",
      render: (e) => formaterDateHeure(e.createdAt),
      valeurTri: (e) => e.createdAt,
    },
    {
      cle: "action",
      entete: "Action",
      render: (e) => (
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
          {LIBELLES_ACTION[e.action] ?? e.action}
        </span>
      ),
      valeurTri: (e) => e.action,
      valeurRecherche: (e) => e.action,
    },
    {
      cle: "acteur",
      entete: "Acteur",
      render: (e) => (e.utilisateur ? `${e.utilisateur.prenom} ${e.utilisateur.nom}` : "Non identifié"),
      valeurTri: (e) => (e.utilisateur ? `${e.utilisateur.prenom} ${e.utilisateur.nom}` : ""),
      valeurRecherche: (e) => (e.utilisateur ? `${e.utilisateur.prenom} ${e.utilisateur.nom} ${e.utilisateur.email}` : ""),
    },
    {
      cle: "organisation",
      entete: "Établissement",
      render: (e) => e.organisation?.nom ?? <span className="text-text-faint">Aucun</span>,
      valeurTri: (e) => e.organisation?.nom ?? "",
    },
    {
      cle: "entite",
      entete: "Entité",
      render: (e) => (
        <span className="text-text-muted">
          {e.entite}
          {e.entiteId ? ` #${e.entiteId.slice(0, 8)}` : ""}
        </span>
      ),
      valeurTri: (e) => e.entite,
    },
    {
      cle: "detail",
      entete: "Détail",
      render: (e) =>
        e.donneesAvant || e.donneesApres ? (
          <button
            type="button"
            onClick={() => setSelection(e)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Voir
          </button>
        ) : (
          <span className="text-text-faint">Aucun détail</span>
        ),
      alignement: "right",
    },
  ];

  return (
    <>
      <DataTable
        colonnes={colonnes}
        lignes={entrees}
        cleLigne={(e) => e.id}
        rechercheEspaceReserve="Rechercher une action, un acteur…"
        videMessage="Aucune entrée d'audit pour l'instant."
      />

      <Modal open={selection !== null} onClose={() => setSelection(null)} title="Détail de l'action">
        <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-bg-subtle p-4 text-xs text-text">
          {JSON.stringify({ avant: selection?.donneesAvant, apres: selection?.donneesApres }, null, 2)}
        </pre>
      </Modal>
    </>
  );
}
