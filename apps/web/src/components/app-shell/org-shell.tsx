"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { GROUPES_ORGANISATION, GROUPES_INDIVIDUEL } from "@/components/app-shell/org-sidebar";
import { AlertsBell, type AlerteResume } from "@/components/app-shell/alerts-bell";
import { ProfileMenu } from "@/components/admin/profile-menu";
import type { UtilisateurProfil } from "@/lib/types";

interface OrgShellProps {
  profil: UtilisateurProfil;
  organisationNom?: string;
  estIndividuel: boolean;
  alertes: AlerteResume[];
  children: ReactNode;
}

// Pas de conteneur autour de children : chaque page organisation apporte déjà
// son propre `mx-auto max-w-* px-5 py-12`.
export function OrgShell({ profil, organisationNom, estIndividuel, alertes, children }: OrgShellProps) {
  return (
    <AppShell
      logoHref={estIndividuel ? "/mes-reservations" : "/tableau-de-bord"}
      groupes={estIndividuel ? GROUPES_INDIVIDUEL : GROUPES_ORGANISATION}
      storagePrefix="dps:org-sidebar"
      placeholderRecherche="Rechercher une page…"
      actions={
        <>
          {organisationNom && (
            <span className="mr-1 hidden max-w-[14rem] truncate rounded-full border border-border bg-bg-subtle px-3 py-1 text-xs font-medium text-text-muted xl:inline">
              {organisationNom}
            </span>
          )}
          {!estIndividuel && <AlertsBell alertes={alertes} />}
          <ProfileMenu
            profil={profil}
            profilHref="/profil"
            parametresHref="/mes-sessions"
            contexte={organisationNom ?? "Compte individuel"}
          />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
