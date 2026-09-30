import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDate } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { ToggleOrganisationButton } from "@/components/admin/toggle-organisation-button";
import type { OrganisationDetailAdmin } from "@/lib/types";

const LIBELLES_TYPE = {
  EH: "Hôpital (EH)",
  ESPC: "Établissement de santé primaire communautaire (ESPC)",
} as const;

export default async function EtablissementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let organisation: OrganisationDetailAdmin;
  try {
    organisation = await apiFetchJson<OrganisationDetailAdmin>(`/organisations/${id}`);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Reveal>
        <Link href="/admin/etablissements" className="text-sm font-medium text-text-muted hover:text-text">
          ← Tous les établissements
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-text">{organisation.nom}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {LIBELLES_TYPE[organisation.type]} · IFU {organisation.ifu}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              organisation.actif ? "bg-success-soft text-success" : "bg-bg-subtle text-text-faint"
            }`}
          >
            {organisation.actif ? "Actif" : "Inactif"}
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-faint">Coordonnées</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-faint">Adresse</dt>
            <dd className="text-text">{organisation.adresse ?? "Non renseignée"}</dd>
          </div>
          <div>
            <dt className="text-text-faint">Téléphone</dt>
            <dd className="text-text">{organisation.telephone ?? "Non renseigné"}</dd>
          </div>
          <div>
            <dt className="text-text-faint">Email</dt>
            <dd className="text-text">{organisation.email ?? "Non renseigné"}</dd>
          </div>
          <div>
            <dt className="text-text-faint">Inscrit le</dt>
            <dd className="text-text">{formaterDate(organisation.createdAt)}</dd>
          </div>
        </dl>
      </Reveal>

      <Reveal delay={0.1} className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-center">
          <p className="font-display text-2xl font-bold text-text">{organisation._count.utilisateurs}</p>
          <p className="mt-1 text-xs text-text-faint">Utilisateurs</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-center">
          <p className="font-display text-2xl font-bold text-text">{organisation._count.patients}</p>
          <p className="mt-1 text-xs text-text-faint">Patients (NEWS)</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-center">
          <p className="font-display text-2xl font-bold text-text">{organisation._count.evenementsIndesirables}</p>
          <p className="mt-1 text-xs text-text-faint">Événements indésirables</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-center">
          <p className="font-display text-2xl font-bold text-text">{organisation._count.reservations}</p>
          <p className="mt-1 text-xs text-text-faint">Réservations</p>
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-6">
        <ToggleOrganisationButton organisationId={organisation.id} actif={organisation.actif} />
      </Reveal>
    </div>
  );
}
