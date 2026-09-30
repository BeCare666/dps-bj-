"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { DataTable, type ColonneTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@/components/icons";
import { basculerTypeEiAction, type EtatAction } from "@/lib/admin-actions";
import { TypeEiForm } from "./type-ei-form";
import type { TypeEi } from "@/lib/types";

function BoutonBasculer({ typeId, actif }: { typeId: string; actif: boolean }) {
  const [etat, action] = useActionState(async (_prevState: EtatAction): Promise<EtatAction> => {
    return basculerTypeEiAction(typeId, actif);
  }, {});

  return (
    <form action={action} className="inline-block">
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

export function TypesEiTable({ types }: { types: TypeEi[] }) {
  const [modalCreation, setModalCreation] = useState(false);

  const colonnes: ColonneTable<TypeEi>[] = [
    {
      cle: "libelle",
      entete: "Libellé",
      render: (t) => <span className="font-medium text-text">{t.libelle}</span>,
      valeurTri: (t) => t.libelle,
      valeurRecherche: (t) => t.libelle,
    },
    {
      cle: "statut",
      entete: "Statut",
      render: (t) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            t.actif ? "bg-success-soft text-success" : "bg-bg-subtle text-text-faint"
          }`}
        >
          {t.actif ? "Actif" : "Inactif"}
        </span>
      ),
      valeurTri: (t) => (t.actif ? 1 : 0),
      alignement: "center",
    },
    {
      cle: "actions",
      entete: "Actions",
      render: (t) => (
        <div className="flex justify-end">
          <BoutonBasculer typeId={t.id} actif={t.actif} />
        </div>
      ),
      alignement: "right",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModalCreation(true)} className="gap-1.5">
          <IconPlus width={16} height={16} />
          Nouveau type
        </Button>
      </div>

      <DataTable
        colonnes={colonnes}
        lignes={types}
        cleLigne={(t) => t.id}
        rechercheEspaceReserve="Rechercher un type d'EI…"
        videMessage="Aucun type d'EI pour l'instant."
      />

      <Modal open={modalCreation} onClose={() => setModalCreation(false)} title="Nouveau type d'événement indésirable">
        <TypeEiForm onSuccess={() => setModalCreation(false)} />
      </Modal>
    </div>
  );
}
