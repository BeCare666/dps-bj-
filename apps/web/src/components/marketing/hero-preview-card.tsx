"use client";

import { motion } from "motion/react";

const POINTS_SPARKLINE = "0,28 12,24 24,26 36,18 48,20 60,10 72,14 84,6 96,9";

export function HeroPreviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Score NEWS</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Risque faible
          </span>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <span className="font-display text-5xl font-bold text-text">2</span>
          <span className="mb-1.5 text-sm text-text-faint">/ 20</span>
        </div>

        <svg viewBox="0 0 96 32" className="mt-4 h-12 w-full text-primary" fill="none">
          <polyline
            points={POINTS_SPARKLINE}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="mt-5 border-t border-border pt-5">
          <span className="text-xs font-medium uppercase tracking-wide text-text-faint">Auto-évaluation</span>
          <ul className="mt-3 flex flex-col gap-2.5">
            {["Hygiène des mains", "Identification du patient", "Traçabilité des soins"].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-text">
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute -right-4 -top-4 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-xs font-medium text-accent shadow-[var(--shadow-soft)]"
      >
        Alerte automatique
      </motion.div>
    </motion.div>
  );
}
