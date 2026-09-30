"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { DataTable, type ColonneTable } from "@/components/ui/data-table";
import { basculerOrganisationAction, type EtatAction } from "@/lib/admin-actions";
import type { Organisation } from "@/lib/types";

const LIBELLES_TYPE: Record<Organisation["type"], string> = {
  EH: "Hôpital (EH)",
  ESPC: "Établissement de santé primaire communautaire (ESPC)",
};

function BoutonBasculer({ organisationId, actif }: { organisationId: string; actif: boolean }) {
  const [etat, action] = useActionState(async (_prevState: EtatAction): Promise<EtatAction> => {
    return basculerOrganisationAction(organisationId, actif);
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
      {pending ? "…" : actif ? "Désactiver" : "Activer"}
    </button>
  );
}

export function EtablissementsTable({ organisations }: { organisations: Organisation[] }) {
  const colonnes: ColonneTable<Organisation>[] = [
    {
      cle: "nom",
      entete: "Établissement",
      render: (o) => (
        <Link href={`/admin/etablissements/${o.id}`} className="font-medium text-text hover:text-primary hover:underline">
          {o.nom}
        </Link>
      ),
      valeurTri: (o) => o.nom,
      valeurRecherche: (o) => `${o.nom} ${o.ifu}`,
    },
    {
      cle: "type",
      entete: "Type",
      render: (o) => LIBELLES_TYPE[o.type],
      valeurTri: (o) => o.type,
    },
    {
      cle: "ifu",
      entete: "IFU",
      render: (o) => <span className="text-text-muted">{o.ifu}</span>,
      valeurTri: (o) => o.ifu,
    },
    {
      cle: "statut",
      entete: "Statut",
      render: (o) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            o.actif ? "bg-success-soft text-success" : "bg-bg-subtle text-text-faint"
          }`}
        >
          {o.actif ? "Actif" : "Inactif"}
        </span>
      ),
      valeurTri: (o) => (o.actif ? 1 : 0),
      alignement: "center",
    },
    {
      cle: "actions",
      entete: "Actions",
      render: (o) => (
        <div className="flex justify-end">
          <BoutonBasculer organisationId={o.id} actif={o.actif} />
        </div>
      ),
      alignement: "right",
    },
  ];

  return (
    <DataTable
      colonnes={colonnes}
      lignes={organisations}
      cleLigne={(o) => o.id}
      rechercheEspaceReserve="Rechercher un établissement…"
      videMessage="Aucun établissement pour l'instant."
    />
  );
}
