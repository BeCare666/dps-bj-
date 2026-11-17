"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

// Bandeau d'information affiché à la première visite (formulaire APDP, 4.2 :
// informer l'utilisateur, dès sa première connexion, de l'utilisation des
// cookies et de leurs finalités). Le site ne dépose que des cookies strictement
// nécessaires (voir /politique-confidentialite) : c'est une information, pas une
// demande de consentement. Une fois fermé, le choix est mémorisé dans le
// stockage local du navigateur.
const CLE = "dps:bandeau-cookies-vu";
const EVENEMENT = "dps:bandeau-cookies";

function abonner(rappel: () => void) {
  window.addEventListener("storage", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}

function dejaVu(): boolean {
  try {
    return window.localStorage.getItem(CLE) === "1";
  } catch {
    // Stockage indisponible (navigation privée stricte) : on n'affiche pas un
    // bandeau impossible à fermer durablement.
    return true;
  }
}

export function BandeauCookies() {
  // Rendu serveur : masqué, pour ne pas faire clignoter le bandeau chez les
  // visiteurs qui l'ont déjà fermé.
  const vu = useSyncExternalStore(abonner, dejaVu, () => true);
  if (vu) return null;

  function fermer() {
    try {
      window.localStorage.setItem(CLE, "1");
    } catch {
      // ignoré : le bandeau réapparaîtra à la prochaine visite.
    }
    window.dispatchEvent(new Event(EVENEMENT));
  }

  return (
    <section
      role="region"
      aria-label="Information sur les cookies"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-sm text-text shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 text-text-muted">
          <span className="font-medium text-text">Cookies.</span> Ce site utilise uniquement des cookies strictement
          nécessaires à votre connexion sécurisée, ainsi que le stockage local de votre navigateur pour mémoriser vos
          préférences d&apos;affichage. Aucun cookie publicitaire ni outil de mesure d&apos;audience.{" "}
          <Link href="/politique-confidentialite#cookies" className="font-medium text-primary hover:underline">
            En savoir plus
          </Link>
        </p>
        <button
          type="button"
          onClick={fermer}
          className="inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          J&apos;ai compris
        </button>
      </div>
    </section>
  );
}
