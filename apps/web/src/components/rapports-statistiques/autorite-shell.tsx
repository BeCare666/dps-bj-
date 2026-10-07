"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import type { GroupeNav } from "@/components/shell/sidebar-nav";
import { IconInbox } from "@/components/icons";

// Espace des autorités sanitaires destinataires des rapports statistiques.
const GROUPES_AUTORITE: GroupeNav[] = [
  { liens: [{ href: "/autorite", label: "Rapports reçus", icon: IconInbox }] },
  { titre: "Compte", liens: [], avecDeconnexion: true },
];

export function AutoriteShell({ autorite, utilisateur, children }: { autorite: string; utilisateur: string; children: ReactNode }) {
  return (
    <AppShell
      logoHref="/autorite"
      groupes={GROUPES_AUTORITE}
      storagePrefix="dps:autorite-sidebar"
      placeholderRecherche="Rechercher une page…"
      actions={
        <div className="text-right text-xs leading-tight">
          <p className="font-semibold text-text">{autorite}</p>
          <p className="text-text-muted">{utilisateur}</p>
        </div>
      }
    >
      <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">{children}</div>
    </AppShell>
  );
}
