import Link from "next/link";
import { deconnexionAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/auto-evaluation", label: "Auto-évaluation" },
  { href: "/news", label: "NEWS" },
  { href: "/evenements-indesirables", label: "Événements indésirables" },
];

export function AppHeader({ organisationNom }: { organisationNom?: string }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <Link href="/tableau-de-bord" className="flex items-center gap-1 font-display text-lg font-bold text-[#0f3d8a]">
            dps<span className="text-accent">.</span>bj
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-muted transition-colors hover:text-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {organisationNom && (
            <span className="hidden text-sm text-text-muted sm:inline">{organisationNom}</span>
          )}
          <form action={deconnexionAction}>
            <Button variant="secondary" type="submit">
              Se déconnecter
            </Button>
          </form>
        </div>
      </div>
      <nav className="flex items-center gap-4 overflow-x-auto border-t border-border px-5 py-2.5 md:hidden">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap text-sm font-medium text-text-muted">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
