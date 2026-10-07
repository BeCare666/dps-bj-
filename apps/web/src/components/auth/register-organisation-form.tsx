"use client";

import { useActionState, useRef, useState } from "react";
import { Field, SelectField } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { AcceptationCgu } from "./acceptation-cgu";
import {
  inscrireOrganisationAction,
  verifierIfuAction,
  type EtatFormulaire,
  type ResultatVerificationIfu,
} from "@/lib/auth-actions";
import { LIBELLES_CIVILITE, LIBELLES_TYPE_STRUCTURE } from "@/lib/libelles-comptes";
import { DEPARTEMENTS } from "@dps/shared";

const ETAT_INITIAL: EtatFormulaire = {};

type EtatIfu = ResultatVerificationIfu | { statut: "en_cours" } | null;

function messageIfu(etat: EtatIfu): { texte: string; classe: string } | null {
  switch (etat?.statut) {
    case "en_cours":
      return { texte: "Vérification de l'IFU auprès de la DGI…", classe: "text-text-muted" };
    case "trouve":
      return etat.nom
        ? { texte: "IFU vérifié auprès de la DGI. Nom de l'établissement pré-rempli, vous pouvez le modifier.", classe: "text-success" }
        : { texte: "IFU vérifié auprès de la DGI (aucun nom renvoyé).", classe: "text-success" };
    case "introuvable":
      return { texte: "Cet IFU est introuvable auprès de la DGI.", classe: "text-danger" };
    case "indisponible":
      return { texte: "La vérification auprès de la DGI est momentanément indisponible. Réessayez plus tard.", classe: "text-warning" };
    case "trop_de_requetes":
      return { texte: "Trop de vérifications en peu de temps. Patientez une minute.", classe: "text-warning" };
    case "non_configure":
      return { texte: "Vérification auprès de la DGI non activée : seul le format de l'IFU est contrôlé.", classe: "text-text-muted" };
    default:
      return null;
  }
}

// §4.1 — informations enregistrées lors de l'inscription du compte Organisation.
export function RegisterOrganisationForm() {
  const [etat, action] = useActionState(inscrireOrganisationAction, ETAT_INITIAL);
  const [ifu, setIfu] = useState("");
  const [nom, setNom] = useState("");
  const [etatIfu, setEtatIfu] = useState<EtatIfu>(null);
  // IFU de la dernière vérification lancée : une réponse plus ancienne
  // arrivée en retard est ignorée.
  const dernierIfu = useRef("");

  async function changerIfu(saisie: string) {
    const valeur = saisie.replace(/\D/g, "").slice(0, 13);
    setIfu(valeur);
    dernierIfu.current = valeur;
    if (valeur.length !== 13) {
      setEtatIfu(null);
      return;
    }
    setEtatIfu({ statut: "en_cours" });
    const resultat = await verifierIfuAction(valeur);
    if (dernierIfu.current !== valeur) return;
    setEtatIfu(resultat);
    if (resultat.statut === "trouve" && resultat.nom) setNom(resultat.nom);
  }

  const message = messageIfu(etatIfu);

  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-faint">Établissement</legend>
        <div className="flex flex-col gap-1.5">
          <Field
            label="IFU (13 chiffres)"
            name="organisationIfu"
            required
            inputMode="numeric"
            pattern="\d{13}"
            maxLength={13}
            title="L'IFU doit comporter exactement 13 chiffres"
            value={ifu}
            onChange={(e) => void changerIfu(e.target.value)}
          />
          {message && (
            <p role="status" className={`text-xs ${message.classe}`}>
              {message.texte}
            </p>
          )}
        </div>
        <Field
          label="Nom de l'établissement"
          name="organisationNom"
          required
          minLength={2}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <Field label="Raison sociale" name="organisationRaisonSociale" required minLength={2} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Type d'établissement" name="organisationTypeStructure" defaultValue="" required>
            <option value="" disabled>
              Sélectionner…
            </option>
            {Object.entries(LIBELLES_TYPE_STRUCTURE).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Catégorie ARS" name="organisationType" defaultValue="EH" required>
            <option value="EH">EH (Établissement hospitalier)</option>
            <option value="ESPC">ESPC (Soins de premiers contacts)</option>
          </SelectField>
        </div>
        <Field label="Adresse (optionnel)" name="organisationAdresse" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ville" name="organisationVille" required minLength={2} />
          <Field label="Pays" name="organisationPays" required minLength={2} defaultValue="Bénin" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Département" name="organisationDepartement" defaultValue="" required>
            <option value="" disabled>
              Sélectionner…
            </option>
            {Object.entries(DEPARTEMENTS).map(([code, libelle]) => (
              <option key={code} value={code}>
                {libelle}
              </option>
            ))}
          </SelectField>
          <Field label="Zone sanitaire" name="organisationZoneSanitaire" required minLength={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Commune" name="organisationCommune" required minLength={2} />
          <Field label="Arrondissement (optionnel)" name="organisationArrondissement" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email de l'établissement" name="organisationEmail" type="email" required />
          <Field
            label="Téléphone de l'établissement"
            name="organisationTelephone"
            type="tel"
            required
            minLength={6}
            placeholder="Format international, ex. +229 01 00 00 00 00"
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-faint">Responsable du compte</legend>
        <SelectField label="Civilité" name="responsableCivilite" defaultValue="" required>
          <option value="" disabled>
            Sélectionner…
          </option>
          {Object.entries(LIBELLES_CIVILITE).map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              {label}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom" name="responsableNom" required />
          <Field label="Prénom" name="responsablePrenom" required />
        </div>
        <Field label="Email" name="responsableEmail" type="email" autoComplete="email" required />
        <Field label="Téléphone (optionnel)" name="responsableTelephone" type="tel" />
        <Field
          label="Mot de passe"
          name="motDePasse"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </fieldset>

      {etat.erreur && (
        <p className="rounded-[var(--radius-md)] bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{etat.erreur}</p>
      )}

      <AcceptationCgu />

      <SubmitButton>Créer le compte établissement</SubmitButton>
    </form>
  );
}
