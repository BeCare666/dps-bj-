"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { DataTable, type ColonneTable } from "@/components/ui/data-table";
import {
  publierGrilleAction,
  archiverGrilleAction,
  nouvelleVersionGrilleAction,
  type EtatAction,
} from "@/lib/grilles-actions";
import type { Grille } from "@/lib/types";

const LIBELLES_TYPE = {
  EH: "Hôpital (EH)",
  ESPC: "ESPC",
} as const;

const LIBELLES_STATUT: Record<Grille["statut"], string> = {
  BROUILLON: "Brouillon",
  PUBLIEE: "Publiée",
  ARCHIVEE: "Archivée",
};

const STYLES_STATUT: Record<Grille["statut"], string> = {
  BROUILLON: "bg-bg-subtle text-text-faint",
  PUBLIEE: "bg-success-soft text-success",
  ARCHIVEE: "bg-warning-soft text-warning",
};

function BoutonAction({
  action,
  grilleId,
  libelle,
  libellePending,
  className,
}: {
  action: (grilleId: string) => Promise<EtatAction>;
  grilleId: string;
  libelle: string;
  libellePending: string;
  className: string;
}) {
  const [etat, dispatch] = useActionState(async (_prevState: EtatAction): Promise<EtatAction> => {
    return action(grilleId);
  }, {});

  return (
    <form action={dispatch} className="inline-block" onClick={(e) => e.stopPropagation()}>
      <BoutonInterne libelle={libelle} libellePending={libellePending} className={className} />
      {etat.erreur && <p className="mt-1 text-xs text-danger">{etat.erreur}</p>}
    </form>
  );
}

function BoutonInterne({
  libelle,
  libellePending,
  className,
}: {
  libelle: string;
  libellePending: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-50`}>
      {pending ? libellePending : libelle}
    </button>
  );
}

export function GrillesTable({ grilles }: { grilles: Grille[] }) {
  const colonnes: ColonneTable<Grille>[] = [
    {
      cle: "nom",
      entete: "Grille",
      render: (g) => (
        <Link href={`/admin/grilles/${g.id}`} className="font-medium text-text hover:text-primary hover:underline">
          {g.nom}
        </Link>
      ),
      valeurTri: (g) => g.nom,
      valeurRecherche: (g) => `${g.nom} ${LIBELLES_TYPE[g.type]}`,
    },
    {
      cle: "type",
      entete: "Type d'établissement",
      render: (g) => LIBELLES_TYPE[g.type],
      valeurTri: (g) => g.type,
    },
    {
      cle: "version",
      entete: "Version",
      render: (g) => `v${g.version}`,
      valeurTri: (g) => g.version,
      alignement: "center",
    },
    {
      cle: "statut",
      entete: "Statut",
      render: (g) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES_STATUT[g.statut]}`}>
          {LIBELLES_STATUT[g.statut]}
        </span>
      ),
      valeurTri: (g) => g.statut,
      alignement: "center",
    },
    {
      cle: "actions",
      entete: "Actions",
      render: (g) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {g.statut === "BROUILLON" && (
            <BoutonAction
              action={publierGrilleAction}
              grilleId={g.id}
              libelle="Publier"
              libellePending="…"
              className="rounded-[var(--radius-md)] border border-success/30 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success-soft"
            />
          )}
          {g.statut === "PUBLIEE" && (
            <BoutonAction
              action={archiverGrilleAction}
              grilleId={g.id}
              libelle="Archiver"
              libellePending="…"
              className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-danger/40 hover:text-danger"
            />
          )}
          {g.statut !== "BROUILLON" && (
            <BoutonAction
              action={nouvelleVersionGrilleAction}
              grilleId={g.id}
              libelle="Nouvelle version"
              libellePending="…"
              className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary/40 hover:bg-primary-soft/60"
            />
          )}
        </div>
      ),
      alignement: "right",
    },
  ];

  return (
    <DataTable
      colonnes={colonnes}
      lignes={grilles}
      cleLigne={(g) => g.id}
      rechercheEspaceReserve="Rechercher une grille…"
      videMessage="Aucune grille d'auto-évaluation pour l'instant."
    />
  );
}
