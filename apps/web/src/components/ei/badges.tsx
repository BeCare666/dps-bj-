import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { GraviteEi, StatutActionCorrective, StatutEi } from "@/lib/types";

export function GraviteBadge({ gravite }: { gravite: GraviteEi | null }) {
  if (!gravite) return <Badge variant="neutral">Non qualifié</Badge>;
  const variants: Record<GraviteEi, BadgeVariant> = { ELEVEE: "danger", MODEREE: "warning", FAIBLE: "success" };
  const libelles: Record<GraviteEi, string> = {
    ELEVEE: "Gravité élevée",
    MODEREE: "Gravité modérée",
    FAIBLE: "Gravité faible",
  };
  return <Badge variant={variants[gravite]}>{libelles[gravite]}</Badge>;
}

export function StatutEiBadge({ statut }: { statut: StatutEi }) {
  const variants: Record<StatutEi, BadgeVariant> = { DECLARE: "primary", EN_TRAITEMENT: "warning", CLOTURE: "success" };
  const libelles: Record<StatutEi, string> = { DECLARE: "Déclaré", EN_TRAITEMENT: "En traitement", CLOTURE: "Clôturé" };
  return <Badge variant={variants[statut]}>{libelles[statut]}</Badge>;
}

export function StatutActionBadge({ statut }: { statut: StatutActionCorrective }) {
  const variants: Record<StatutActionCorrective, BadgeVariant> = {
    A_FAIRE: "neutral",
    EN_COURS: "warning",
    REALISEE: "success",
  };
  const libelles: Record<StatutActionCorrective, string> = {
    A_FAIRE: "À faire",
    EN_COURS: "En cours",
    REALISEE: "Réalisée",
  };
  return <Badge variant={variants[statut]}>{libelles[statut]}</Badge>;
}
