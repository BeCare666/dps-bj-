"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import type { GroupeNav } from "@/components/shell/sidebar-nav";
import {
  IconBarChart,
  IconCompass,
  IconDroplet,
  IconGrid,
  IconHeartPulse,
  IconHome,
  IconHospital,
  IconInbox,
  IconTarget,
  IconVirus,
  IconVitals,
} from "@/components/icons";

// Espace des autorités sanitaires (ROADMAP_ESPACE_AUTORITES.md, étape 4.1) :
// pilotage des transmissions et analyses des rapports statistiques reçus.
const GROUPES_AUTORITE: GroupeNav[] = [
  {
    titre: "Pilotage",
    liens: [
      { href: "/autorite", label: "Tableau de bord", icon: IconHome, exact: true },
      { href: "/autorite/rapports", label: "Rapports reçus", icon: IconInbox },
      { href: "/autorite/transmissions", label: "Suivi des transmissions", icon: IconGrid },
      { href: "/autorite/etablissements", label: "Établissements", icon: IconHospital },
    ],
  },
  {
    titre: "Analyses",
    liens: [
      { href: "/autorite/epidemiologie", label: "Épidémiologie (BS-a)", icon: IconBarChart },
      { href: "/autorite/surveillance", label: "Surveillance hebdomadaire", icon: IconVirus },
      { href: "/autorite/paludisme", label: "Paludisme (PNLP1)", icon: IconTarget },
      { href: "/autorite/mnt", label: "Maladies non transmissibles", icon: IconHeartPulse },
      { href: "/autorite/transfusion", label: "Transfusion sanguine", icon: IconDroplet },
    ],
  },
  {
    titre: "Outils",
    liens: [{ href: "/autorite/explorateur", label: "Explorateur d'indicateurs", icon: IconCompass }],
  },
  { titre: "Compte", liens: [{ href: "/autorite/compte", label: "Mon autorité", icon: IconVitals }], avecDeconnexion: true },
];

export function AutoriteShell({ autorite, utilisateur, children }: { autorite: string; utilisateur: string; children: ReactNode }) {
  return (
    <AppShell
      logoHref="/autorite"
      groupes={GROUPES_AUTORITE}
      storagePrefix="dps:autorite-sidebar"
      placeholderRecherche="Rechercher une page…"
      actions={
        <div className="hidden text-right text-xs leading-tight sm:block">
          <p className="font-semibold text-text">{autorite}</p>
          <p className="text-text-muted">{utilisateur}</p>
        </div>
      }
    >
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">{children}</div>
    </AppShell>
  );
}
