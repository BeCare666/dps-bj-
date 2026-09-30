import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { formaterDate } from "@/lib/format";
import { Reveal } from "@/components/motion/reveal";
import { ToggleUtilisateurButton } from "@/components/admin/toggle-utilisateur-button";
import { SessionsList } from "@/components/comptes/sessions-list";
import { RoleForm, RetirerRoleButton } from "@/components/admin/role-form";
import type { SessionUtilisateur, UtilisateurAdmin } from "@/lib/types";

const LIBELLES_ROLE: Record<string, string> = {
  RESPONSABLE_COMPTE: "Responsable de compte",
  RESP_QUALITE: "Responsable qualité",
  PERSONNEL_SOIGNANT: "Personnel soignant",
  GESTIONNAIRE_FORMATION: "Gestionnaire formation",
  ADMIN_PLATEFORME: "Admin plateforme",
};

export default async function UtilisateurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let utilisateur: UtilisateurAdmin;
  let sessions: SessionUtilisateur[];
  try {
    [utilisateur, sessions] = await Promise.all([
      apiFetchJson<UtilisateurAdmin>(`/utilisateurs/${id}`),
      apiFetchJson<SessionUtilisateur[]>(`/utilisateurs/${id}/sessions`),
    ]);
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.status === 404) notFound();
    throw erreur;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <Link href="/admin/utilisateurs" className="text-sm font-medium text-text-muted hover:text-text">
          ← Tous les utilisateurs
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-text">
              {utilisateur.prenom} {utilisateur.nom}
            </h1>
            <p className="mt-1 text-sm text-text-muted">{utilisateur.email}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              utilisateur.actif ? "bg-success-soft text-success" : "bg-bg-subtle text-text-faint"
            }`}
          >
            {utilisateur.actif ? "Actif" : "Désactivé"}
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-faint">Établissement</dt>
            <dd className="text-text">
              {utilisateur.organisation ? (
                <Link href={`/admin/etablissements/${utilisateur.organisation.id}`} className="text-primary hover:underline">
                  {utilisateur.organisation.nom}
                </Link>
              ) : (
                "Aucun établissement"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-text-faint">Type de compte</dt>
            <dd className="text-text">{utilisateur.typeCompte}</dd>
          </div>
          <div>
            <dt className="text-text-faint">Email vérifié</dt>
            <dd className="text-text">{utilisateur.emailVerifieLe ? formaterDate(utilisateur.emailVerifieLe) : "Non"}</dd>
          </div>
          <div>
            <dt className="text-text-faint">Inscrit le</dt>
            <dd className="text-text">{formaterDate(utilisateur.createdAt)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {utilisateur.roles.map((r) => (
            <span
              key={r.role}
              className="flex items-center rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary"
            >
              {LIBELLES_ROLE[r.role] ?? r.role}
              <RetirerRoleButton utilisateurId={utilisateur.id} role={r.role} />
            </span>
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <RoleForm utilisateurId={utilisateur.id} rolesActuels={utilisateur.roles.map((r) => r.role)} />
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-6">
        <ToggleUtilisateurButton utilisateurId={utilisateur.id} actif={utilisateur.actif} />
      </Reveal>

      <Reveal delay={0.15} className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-faint">
          Sessions ({sessions.length})
        </h2>
        <SessionsList utilisateurId={utilisateur.id} sessions={sessions} />
      </Reveal>
    </div>
  );
}
