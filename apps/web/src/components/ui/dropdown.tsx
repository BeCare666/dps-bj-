"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

// Primitive générique (Phase 2) factorisant le pattern déjà câblé ad hoc dans
// ProfileMenu/NotificationsBell (trigger + panneau flottant + clic-dehors +
// Échap implicite via AnimatePresence) — disponible pour de nouveaux besoins,
// les deux composants existants ne sont pas migrés dans cette phase (déjà
// vérifiés visuellement, cf. ROADMAP.md §10 — risque de régression évité).
export function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: (props: { ouvert: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", onClicExterieur);
    return () => document.removeEventListener("mousedown", onClicExterieur);
  }, []);

  return (
    <div ref={conteneurRef} className="relative">
      {trigger({ ouvert, toggle: () => setOuvert((v) => !v) })}
      <AnimatePresence>
        {ouvert && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-40 mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-elevated)] ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
