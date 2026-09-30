import Link from "next/link";
import { SocialIcon } from "@/components/marketing/social-icons";
import { RESEAUX_SOCIAUX, SITE } from "@/lib/site-config";

const COLONNES = [
  {
    titre: "Plateforme",
    liens: [
      { href: "/#modules", label: "Auto-évaluation qualité" },
      { href: "/#modules", label: "Score NEWS" },
      { href: "/#modules", label: "Événements indésirables" },
      { href: "/formations", label: "Formations" },
    ],
  },
  {
    titre: "Établissement",
    liens: [
      { href: "/inscription", label: "Créer un compte" },
      { href: "/login", label: "Se connecter" },
      { href: "/#etablissements", label: "Hôpitaux et centres de santé" },
      { href: "/#securite", label: "Sécurité des données" },
    ],
  },
  {
    titre: "À propos",
    liens: [
      { href: "/a-propos", label: "Notre mission" },
      { href: "/#fonctionnement", label: "Comment ça marche" },
      { href: `mailto:${SITE.emailContact}`, label: "Nous contacter" },
    ],
  },
  {
    titre: "Informations légales",
    liens: [
      { href: "/conditions-utilisation", label: "Conditions d'utilisation" },
      { href: "/politique-confidentialite", label: "Politique de confidentialité" },
      { href: "/politique-confidentialite#cookies", label: "Cookies" },
      { href: "/conditions-utilisation#credits", label: "Crédits photographiques" },
    ],
  },
];

export function SiteFooter() {
  const annee = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      {/* Halo discret en haut du footer, pour détacher la surface sombre du contenu. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-16 sm:px-8 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link href="/" className="font-display text-2xl font-bold tracking-tight text-white">
              dps<span className="text-accent">.</span>bj
            </Link>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/50">{SITE.nomComplet}</p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
              La plateforme qui accompagne les établissements de santé du Bénin dans l&apos;évaluation,
              la surveillance et l&apos;amélioration continue de la sécurité des soins.
            </p>

            <a
              href={`mailto:${SITE.emailContact}`}
              className="mt-6 inline-flex items-center gap-2.5 text-sm text-white/80 transition-colors hover:text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3.5 6.5 8.5 6 8.5-6" />
                </svg>
              </span>
              {SITE.emailContact}
            </a>

            <ul className="mt-8 flex flex-wrap gap-3" aria-label="Réseaux sociaux">
              {RESEAUX_SOCIAUX.map(({ reseau, label, href }) => (
                <li key={reseau}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${SITE.nom} sur ${label}`}
                    className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.04] text-white/75 transition-all duration-500 hover:-translate-y-0.5 hover:border-white/40 hover:text-navy"
                  >
                    {/* Remplissage qui monte au survol, avec un fin reflet. */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 translate-y-full rounded-full bg-gradient-to-t from-white to-white/90 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]"
                    />
                    <SocialIcon reseau={reseau} width={18} height={18} className="relative" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {COLONNES.map((colonne) => (
              <nav key={colonne.titre} aria-label={colonne.titre}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{colonne.titre}</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {colonne.liens.map((lien) => (
                    <li key={lien.label}>
                      <Link
                        href={lien.href}
                        className="group inline-flex text-sm leading-5 text-white/70 transition-colors hover:text-white"
                      >
                        <span className="bg-gradient-to-r from-white to-white bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                          {lien.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {annee} {SITE.nom}. {SITE.nomComplet}. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/conditions-utilisation" className="transition-colors hover:text-white">
              Conditions d&apos;utilisation
            </Link>
            <Link href="/politique-confidentialite" className="transition-colors hover:text-white">
              Confidentialité
            </Link>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="flex h-3 w-[18px] overflow-hidden rounded-[2px]">
                {/* Drapeau du Bénin : bande verte verticale, jaune et rouge horizontales. */}
                <span className="h-full w-[40%] bg-[#008751]" />
                <span className="flex h-full flex-1 flex-col">
                  <span className="flex-1 bg-[#fcd116]" />
                  <span className="flex-1 bg-[#e8112d]" />
                </span>
              </span>
              Conçu pour les établissements de santé du Bénin
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
