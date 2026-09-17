import type { NiveauRisqueNews, StatutAlerte, StatutPatient } from "@/lib/types";

export function RisqueBadge({ niveau }: { niveau: NiveauRisqueNews }) {
  if (niveau === "ELEVE") {
    return (
      <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
        Risque élevé
      </span>
    );
  }
  if (niveau === "MOYEN") {
    return (
      <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
        Risque moyen
      </span>
    );
  }
  return (
    <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">Risque bas</span>
  );
}

export function StatutAlerteBadge({ statut }: { statut: StatutAlerte }) {
  const styles: Record<StatutAlerte, string> = {
    OUVERTE: "bg-danger-soft text-danger",
    EN_COURS: "bg-warning-soft text-warning",
    CLOTUREE: "bg-success-soft text-success",
  };
  const libelles: Record<StatutAlerte, string> = {
    OUVERTE: "Ouverte",
    EN_COURS: "En cours",
    CLOTUREE: "Clôturée",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[statut]}`}>{libelles[statut]}</span>
  );
}

export function StatutPatientBadge({ statut }: { statut: StatutPatient }) {
  if (statut === "SORTI") {
    return <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-xs font-medium text-text-faint">Sorti</span>;
  }
  return (
    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">Hospitalisé</span>
  );
}
