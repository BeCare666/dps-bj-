import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type SectionLegale } from "@/components/marketing/legal-page";
import { EDITEUR, HEBERGEURS, SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de DSP : éditeur du site, directeur de la publication et hébergeurs.",
};

const SECTIONS: SectionLegale[] = [
  {
    id: "editeur",
    titre: "Éditeur du site",
    contenu: (
      <ul>
        <li>
          <strong>Raison sociale</strong> : {EDITEUR.raisonSociale}
        </li>
        <li>
          <strong>Forme juridique</strong> : {EDITEUR.formeJuridique}
        </li>
        <li>
          <strong>Siège social</strong> : {EDITEUR.adresse}, {SITE.pays}
        </li>
        <li>
          <strong>Registre du commerce</strong> : {EDITEUR.rccm}
        </li>
        {EDITEUR.ifu && (
          <li>
            <strong>IFU</strong> : {EDITEUR.ifu}
          </li>
        )}
        <li>
          <strong>Téléphone</strong> : <a href={EDITEUR.telephoneHref}>{EDITEUR.telephone}</a>
        </li>
        <li>
          <strong>Email</strong> : <a href={`mailto:${SITE.emailContact}`}>{SITE.emailContact}</a>
        </li>
      </ul>
    ),
  },
  ...(EDITEUR.directeurPublication
    ? [
        {
          id: "directeur-publication",
          titre: "Directeur de la publication",
          contenu: (
            <p>
              {EDITEUR.directeurPublication.nom}
              {EDITEUR.directeurPublication.fonction ? `, ${EDITEUR.directeurPublication.fonction}` : ""}.
            </p>
          ),
        },
      ]
    : []),
  {
    id: "hebergement",
    titre: "Hébergement",
    contenu: (
      <>
        <p>Le site et ses données sont hébergés par les prestataires suivants :</p>
        <ul>
          {HEBERGEURS.map((h) => (
            <li key={h.role}>
              <strong>{h.role}</strong> : {h.societe}
              {h.adresse ? `, ${h.adresse}` : ""}. Contact : <a href={`mailto:${h.email}`}>{h.email}</a> ·{" "}
              <a href={h.site} target="_blank" rel="noopener noreferrer">
                {h.site.replace("https://", "")}
              </a>
            </li>
          ))}
        </ul>
        <p>
          La localisation des données et le rôle de chaque prestataire sont détaillés dans la{" "}
          <Link href="/politique-confidentialite">politique de confidentialité</Link>.
        </p>
      </>
    ),
  },
  {
    id: "donnees-personnelles",
    titre: "Données personnelles et cookies",
    contenu: (
      <p>
        Le traitement des données personnelles et l&apos;usage des cookies sont décrits dans la{" "}
        <Link href="/politique-confidentialite">politique de confidentialité</Link>. Les conditions d&apos;accès et
        d&apos;utilisation de la plateforme figurent dans les{" "}
        <Link href="/conditions-utilisation">conditions générales d&apos;utilisation</Link>.
      </p>
    ),
  },
  {
    id: "credits",
    titre: "Crédits photographiques",
    contenu: (
      <p>
        Les photographies de la vitrine sont issues de Wikimedia Commons, sous licence libre. Leurs auteurs et
        licences sont indiqués dans la section{" "}
        <Link href="/conditions-utilisation#credits">crédits photographiques</Link> des conditions d&apos;utilisation.
      </p>
    ),
  },
];

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      surtitre="Informations légales"
      titre="Mentions légales"
      introduction={
        <p>
          Le site {SITE.nom}, {SITE.nomComplet}, est édité par {EDITEUR.raisonSociale}. Pour toute question, vous
          pouvez écrire à{" "}
          <a className="font-medium text-primary hover:underline" href={`mailto:${SITE.emailContact}`}>{SITE.emailContact}</a>.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
