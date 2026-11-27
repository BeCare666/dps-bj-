"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { TARIFS_FORMATION_DEFAUT, TRANCHES_TARIF_FORMATION } from "@dps/shared";
import { Field, SelectField } from "@/components/ui/field";
import type { EtatAction } from "@/lib/admin-actions";
import type { Formation } from "@/lib/types";

const ETAT_INITIAL: EtatAction = {};

function Bouton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
    >
      {pending ? "Enregistrement…" : label}
    </button>
  );
}

export function FormationForm({
  action,
  formation,
  libelleBouton,
  onSuccess,
}: {
  action: (etat: EtatAction, formData: FormData) => Promise<EtatAction>;
  formation?: Formation;
  libelleBouton: string;
  onSuccess: () => void;
}) {
  const [etat, formAction] = useActionState(action, ETAT_INITIAL);

  useEffect(() => {
    if (etat.succes) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.succes]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Titre" name="titre" required minLength={3} defaultValue={formation?.titre} />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="Type d'établissement" name="typeEtablissement" defaultValue={formation?.typeEtablissement ?? ""}>
          <option value="">Hors catalogue officiel</option>
          <option value="EH">EH</option>
          <option value="ESPC">ESPC</option>
        </SelectField>
        <Field label="Critère ARS" name="critere" placeholder="ex. C.2.1.1" defaultValue={formation?.critere ?? ""} />
        <SelectField label="Niveau du critère" name="niveau" defaultValue={formation?.niveau ?? ""}>
          <option value="">Non renseigné</option>
          <option value="ESSENTIEL">Essentiel</option>
          <option value="FONDAMENTAL">Fondamental</option>
          <option value="AVANCE">Avancé</option>
        </SelectField>
      </div>
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <Field label="Domaine (code)" name="domaineCode" placeholder="A à E" maxLength={1} defaultValue={formation?.domaineCode ?? ""} />
        <Field label="Domaine" name="domaine" defaultValue={formation?.domaine ?? ""} />
      </div>
      <ZoneTexte label="Public" name="publicCible" rows={2} defaultValue={formation?.publicCible} />
      <ZoneTexte label="Description (présentation)" name="description" required minLength={10} rows={3} defaultValue={formation?.description} />
      <ZoneTexte label="Objectif" name="objectifs" rows={2} defaultValue={formation?.objectifs} />
      <ZoneTexte label="Exigence ARS" name="exigenceArs" rows={2} defaultValue={formation?.exigenceArs} />
      <ZoneTexte label="Contenus" name="contenus" rows={4} defaultValue={formation?.contenus} />
      <div className="grid gap-4 sm:grid-cols-2">
        <ZoneTexte label="Méthode" name="methode" rows={2} defaultValue={formation?.methode} />
        <ZoneTexte label="Évaluation" name="evaluation" rows={2} defaultValue={formation?.evaluation} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Durée (libellé)" name="dureeLibelle" placeholder="ex. 7 h, mise à jour annuelle 2 h" defaultValue={formation?.dureeLibelle ?? ""} />
        <Field label="Durée initiale (heures)" name="dureeHeures" type="number" min={0} step={0.25} defaultValue={formation?.dureeHeures ?? undefined} />
        <Field label="Ordre d'affichage" name="ordre" type="number" min={0} defaultValue={formation?.ordre ?? undefined} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {TRANCHES_TARIF_FORMATION.map((t) => (
          <Field
            key={t.cle}
            label={`${t.libelle} (FCFA / personne)`}
            name={t.cle}
            type="number"
            min={0}
            required
            defaultValue={formation?.[t.cle] ?? TARIFS_FORMATION_DEFAUT[t.cle]}
          />
        ))}
      </div>
      <p className="-mt-2 text-xs text-text-faint">
        Prix par personne selon la taille du groupe réservé. Par défaut : 5 000, 3 000 et 2 000 FCFA.
      </p>

      {etat.erreur && <p className="text-sm text-danger">{etat.erreur}</p>}
      <div>
        <Bouton label={libelleBouton} />
      </div>
    </form>
  );
}

function ZoneTexte({
  label,
  name,
  defaultValue,
  ...props
}: { label: string; name: string; defaultValue?: string | null } & Omit<React.ComponentPropsWithoutRef<"textarea">, "defaultValue">) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`formation-${name}`} className="text-sm font-medium text-text">
        {label}
      </label>
      <textarea
        id={`formation-${name}`}
        name={name}
        defaultValue={defaultValue ?? ""}
        {...props}
        className="rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
      />
    </div>
  );
}
