import type { GraviteEi, StatutActionCorrective, StatutEi } from "@/lib/types";

export function GraviteBadge({ gravite }: { gravite: GraviteEi | null }) {
  if (!gravite) {
    return (
      <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-xs font-medium text-text-faint">
        Non qualifié
      </span>
    );
  }
  const styles: Record<GraviteEi, string> = {
    ELEVEE: "bg-danger-soft text-danger",
    MODEREE: "bg-warning-soft text-warning",
    FAIBLE: "bg-success-soft text-success",
  };
  const libelles: Record<GraviteEi, string> = {
    ELEVEE: "Gravité élevée",
    MODEREE: "Gravité modérée",
    FAIBLE: "Gravité faible",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[gravite]}`}>{libelles[gravite]}</span>;
}

export function StatutEiBadge({ statut }: { statut: StatutEi }) {
  const styles: Record<StatutEi, string> = {
    DECLARE: "bg-primary-soft text-primary",
    EN_TRAITEMENT: "bg-warning-soft text-warning",
    CLOTURE: "bg-success-soft text-success",
  };
  const libelles: Record<StatutEi, string> = {
    DECLARE: "Déclaré",
    EN_TRAITEMENT: "En traitement",
    CLOTURE: "Clôturé",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[statut]}`}>{libelles[statut]}</span>;
}

export function StatutActionBadge({ statut }: { statut: StatutActionCorrective }) {
  const styles: Record<StatutActionCorrective, string> = {
    A_FAIRE: "bg-bg-subtle text-text-faint",
    EN_COURS: "bg-warning-soft text-warning",
    REALISEE: "bg-success-soft text-success",
  };
  const libelles: Record<StatutActionCorrective, string> = {
    A_FAIRE: "À faire",
    EN_COURS: "En cours",
    REALISEE: "Réalisée",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[statut]}`}>{libelles[statut]}</span>;
}
