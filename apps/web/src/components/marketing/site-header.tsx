"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shell/logo";

const NAV_LINKS = [
  { href: "/#modules", label: "Modules" },
  { href: "/#etablissements", label: "Établissements" },
  { href: "/formations", label: "Formations" },
  { href: "/a-propos", label: "À propos" },
];

export function SiteHeader() {
  const [ouvert, setOuvert] = useState(false);
  const [defile, setDefile] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setDefile(y > 12));

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300 ${
        defile ? "border-border/70 bg-bg/90 shadow-[0_8px_30px_-18px_rgba(10,26,56,0.35)]" : "border-transparent bg-bg/70"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
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

        <div className="hidden items-center gap-3 md:flex">
          <Button href="/login" variant="ghost">
            Se connecter
          </Button>
          <Button href="/inscription" variant="primary">
            Créer un compte
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-label="Ouvrir le menu"
          aria-expanded={ouvert}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-text md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {ouvert ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {ouvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-b border-border/70 bg-bg md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOuvert(false)}
                  className="rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-bg-subtle hover:text-text"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Button href="/login" variant="secondary" className="w-full">
                  Se connecter
                </Button>
                <Button href="/inscription" variant="primary" className="w-full">
                  Créer un compte
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
