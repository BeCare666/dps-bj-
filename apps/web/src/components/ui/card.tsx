import type { ReactNode } from "react";

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-[var(--radius-lg)] border border-border bg-surface p-6 ${className}`}>{children}</div>
  );
}

// Extrait de (admin)/admin/page.tsx (Phase 2) — était défini localement, non
// réutilisable par un futur dashboard organisation (Phase 6) sans copier-coller.
export function StatCard({ label, valeur, sousTexte }: { label: string; valeur: string; sousTexte?: string }) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-text-faint">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-text">{valeur}</p>
      {sousTexte && <p className="mt-1 text-xs text-text-muted">{sousTexte}</p>}
    </Card>
  );
}
