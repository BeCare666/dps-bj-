"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { DataTable, type ColonneTable } from "@/components/ui/data-table";
import { formaterDate } from "@/lib/format";
import { basculerUtilisateurAction, type EtatAction } from "@/lib/admin-actions";
import type { UtilisateurAdmin } from "@/lib/types";

const LIBELLES_ROLE: Record<string, string> = {
  RESPONSABLE_COMPTE: "Responsable de compte",
  RESP_QUALITE: "Responsable qualité",
  PERSONNEL_SOIGNANT: "Personnel soignant",
  GESTIONNAIRE_FORMATION: "Gestionnaire formation",
  ADMIN_PLATEFORME: "Admin plateforme",
};

function BoutonBasculer({ utilisateurId, actif }: { utilisateurId: string; actif: boolean }) {
  const [etat, action] = useActionState(async (_prevState: EtatAction): Promise<EtatAction> => {
    return basculerUtilisateurAction(utilisateurId, actif);
  }, {});

  return (
    <form action={action} className="inline-block" onClick={(e) => e.stopPropagation()}>
      <BoutonInterne actif={actif} />
      {etat.erreur && <p className="mt-1 text-xs text-danger">{etat.erreur}</p>}
    </form>
  );
}

function BoutonInterne({ actif }: { actif: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        actif
          ? "border-border text-text-muted hover:border-danger/40 hover:text-danger"
          : "border-success/30 text-success hover:bg-success-soft"
      }`}
    >
      {pending ? "…" : actif ? "Désactiver" : "Réactiver"}
    </button>
  );
}

export function UtilisateursTable({ utilisateurs }: { utilisateurs: UtilisateurAdmin[] }) {
  const colonnes: ColonneTable<UtilisateurAdmin>[] = [
    {
      cle: "nom",
      entete: "Utilisateur",
      render: (u) => (
        <div>
          <Link
            href={`/admin/utilisateurs/${u.id}`}
            className="font-medium text-text hover:text-primary hover:underline"
          >
            {u.prenom} {u.nom}
          </Link>
          <p className="text-xs text-text-faint">{u.email}</p>
        </div>
      ),
      valeurTri: (u) => `${u.prenom} ${u.nom}`,
      valeurRecherche: (u) => `${u.prenom} ${u.nom} ${u.email} ${u.organisation?.nom ?? ""}`,
    },
    {
      cle: "organisation",
      entete: "Établissement",
      render: (u) => u.organisation?.nom ?? <span className="text-text-faint">Aucun établissement</span>,
      valeurTri: (u) => u.organisation?.nom ?? "",
    },
    {
      cle: "roles",
      entete: "Rôle(s)",
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => (
            <span key={r.role} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">
              {LIBELLES_ROLE[r.role] ?? r.role}
            </span>
          ))}
        </div>
      ),
    },
    {
      cle: "statut",
      entete: "Statut",
      render: (u) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            u.actif ? "bg-success-soft text-success" : "bg-bg-subtle text-text-faint"
          }`}
        >
          {u.actif ? "Actif" : "Désactivé"}
        </span>
      ),
      valeurTri: (u) => (u.actif ? 1 : 0),
      alignement: "center",
    },
    {
      cle: "createdAt",
      entete: "Inscrit le",
      render: (u) => formaterDate(u.createdAt),
      valeurTri: (u) => u.createdAt,
    },
    {
      cle: "actions",
      entete: "Actions",
      render: (u) => (
        <div className="flex justify-end">
          <BoutonBasculer utilisateurId={u.id} actif={u.actif} />
        </div>
      ),
      alignement: "right",
    },
  ];

  return (
    <DataTable
      colonnes={colonnes}
      lignes={utilisateurs}
      cleLigne={(u) => u.id}
      rechercheEspaceReserve="Rechercher un utilisateur…"
      videMessage="Aucun utilisateur pour l'instant."
    />
  );
}
