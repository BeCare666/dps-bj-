import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-display text-base font-bold text-[#0f3d8a]">
            dps<span className="text-accent">.</span>bj
          </div>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Dispositif de Sécurité des Patients — accompagner les établissements de santé du Bénin vers l&apos;excellence des soins.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
          <Link href="/formations" className="hover:text-text">
            Formations
          </Link>
          <Link href="/a-propos" className="hover:text-text">
            À propos
          </Link>
          <Link href="/login" className="hover:text-text">
            Se connecter
          </Link>
        </nav>
      </div>
      <div className="border-t border-border px-5 py-4 text-center text-xs text-text-faint sm:px-8">
        © {new Date().getFullYear()} dps.bj — Tous droits réservés.
      </div>
    </footer>
  );
}
