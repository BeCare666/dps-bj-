import type { Metadata } from "next";
import { ROLE_PERMISSIONS } from "@dps/shared";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Administration · Rôles & permissions",
  robots: { index: false, follow: false },
};

const LIBELLES_ROLE: Record<string, string> = {
  RESPONSABLE_COMPTE: "Responsable de compte",
  RESP_QUALITE: "Responsable qualité",
  PERSONNEL_SOIGNANT: "Personnel soignant",
  GESTIONNAIRE_FORMATION: "Gestionnaire formation",
  ADMIN_PLATEFORME: "Admin plateforme",
};

export default function AdminRolesPage() {
  return (
    <div>
      <Reveal>
        <p className="mb-6 text-sm text-text-muted">
          Catalogue des permissions accordées à chaque rôle, en lecture seule. Pour attribuer un rôle à un
          utilisateur, ouvrez sa fiche dans « Utilisateurs ».
        </p>
      </Reveal>

      <div className="flex flex-col gap-4">
        {(Object.keys(ROLE_PERMISSIONS) as Array<keyof typeof ROLE_PERMISSIONS>).map((role, i) => (
          <Reveal key={role} delay={i * 0.05} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <h2 className="font-display text-base font-semibold text-text">{LIBELLES_ROLE[role] ?? role}</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ROLE_PERMISSIONS[role].length === 0 ? (
                <span className="text-sm text-text-faint">Aucune permission.</span>
              ) : (
                ROLE_PERMISSIONS[role].map((permission) => (
                  <span key={permission} className="rounded-full bg-bg-subtle px-2.5 py-1 text-xs text-text-muted">
                    {permission}
                  </span>
                ))
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
