"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { DataTable, type ColonneTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@/components/icons";
import { formaterFcfa } from "@/lib/format";
import {
  basculerFormationAction,
  creerFormationAction,
  modifierFormationAction,
  type EtatAction,
} from "@/lib/admin-actions";
import { FormationForm } from "./formation-form";
import type { Formation } from "@/lib/types";

function BoutonBasculer({ formationId, actif }: { formationId: string; actif: boolean }) {
  const [etat, action] = useActionState(async (_prevState: EtatAction): Promise<EtatAction> => {
    return basculerFormationAction(formationId, actif);
  }, {});

  return (
    <form action={action} className="inline-block">
      <BoutonBasculerInterne actif={actif} />
      {etat.erreur && <p className="mt-1 text-xs text-danger">{etat.erreur}</p>}
    </form>
  );
}

function BoutonBasculerInterne({ actif }: { actif: boolean }) {
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

export function FormationsTable({ formations }: { formations: Formation[] }) {
  const [modalCreation, setModalCreation] = useState(false);
  const [formationEnEdition, setFormationEnEdition] = useState<Formation | null>(null);

  const colonnes: ColonneTable<Formation>[] = [
    {
      cle: "titre",
      entete: "Titre",
      render: (f) => (
        <div>
          <p className="font-medium text-text">{f.titre}</p>
          {f.dureeHeures && <p className="text-xs text-text-faint">{f.dureeHeures} heures</p>}
        </div>
      ),
      valeurTri: (f) => f.titre,
      valeurRecherche: (f) => f.titre,
    },
    {
      cle: "prixIndividuel",
      entete: "Individuel",
      render: (f) => formaterFcfa(f.prixIndividuel),
      valeurTri: (f) => f.prixIndividuel,
      alignement: "right",
    },
    {
      cle: "prixGroupe5",
      entete: "Groupe 5",
      render: (f) => formaterFcfa(f.prixGroupe5),
      valeurTri: (f) => f.prixGroupe5,
      alignement: "right",
    },
    {
      cle: "prixGroupe10",
      entete: "Groupe 10",
      render: (f) => formaterFcfa(f.prixGroupe10),
      valeurTri: (f) => f.prixGroupe10,
      alignement: "right",
    },
    {
      cle: "statut",
      entete: "Statut",
      render: (f) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            f.actif ? "bg-success-soft text-success" : "bg-bg-subtle text-text-faint"
          }`}
        >
          {f.actif ? "Active" : "Inactive"}
        </span>
      ),
      valeurTri: (f) => (f.actif ? 1 : 0),
      alignement: "center",
    },
    {
      cle: "actions",
      entete: "Actions",
      render: (f) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setFormationEnEdition(f)}
            className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary/40 hover:bg-primary-soft/60"
          >
            Modifier
          </button>
          <BoutonBasculer formationId={f.id} actif={f.actif} />
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
          Nouvelle formation
        </Button>
      </div>

      <DataTable
        colonnes={colonnes}
        lignes={formations}
        cleLigne={(f) => f.id}
        rechercheEspaceReserve="Rechercher une formation…"
        videMessage="Aucune formation pour l'instant."
      />

      <Modal open={modalCreation} onClose={() => setModalCreation(false)} title="Nouvelle formation">
        <FormationForm action={creerFormationAction} libelleBouton="Créer" onSuccess={() => setModalCreation(false)} />
      </Modal>

      <Modal
        open={formationEnEdition !== null}
        onClose={() => setFormationEnEdition(null)}
        title={`Modifier « ${formationEnEdition?.titre ?? ""} »`}
      >
        {formationEnEdition && (
          <FormationForm
            action={modifierFormationAction.bind(null, formationEnEdition.id)}
            formation={formationEnEdition}
            libelleBouton="Enregistrer"
            onSuccess={() => setFormationEnEdition(null)}
          />
        )}
      </Modal>
    </div>
  );
}
