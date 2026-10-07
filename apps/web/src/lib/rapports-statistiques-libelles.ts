import { DEPARTEMENTS, formulaireStatistique, libellePeriode, type CleEntete } from "@dps/shared";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatutRapportStatistique } from "./types";

export const LIBELLES_STATUT_RAPPORT: Record<StatutRapportStatistique, string> = {
  BROUILLON: "Brouillon",
  SOUMIS: "Soumis",
  VALIDE: "Validé",
};

export const VARIANTES_STATUT_RAPPORT: Record<StatutRapportStatistique, BadgeVariant> = {
  BROUILLON: "neutral",
  SOUMIS: "info",
  VALIDE: "success",
};

export const LIBELLES_ENTETE: Record<CleEntete, string> = {
  departement: "Département",
  zoneSanitaire: "Zone sanitaire",
  commune: "Commune",
  arrondissement: "Arrondissement",
  formationSanitaire: "Formation sanitaire",
  telephone: "Téléphone",
  email: "Email",
};

export const LIBELLES_NIVEAU_AUTORITE = {
  ZONE_SANITAIRE: "Zone sanitaire",
  DEPARTEMENT: "Direction départementale",
  NATIONAL: "Niveau national",
} as const;

export function libelleDepartement(code: string | null | undefined): string {
  if (!code) return "—";
  return DEPARTEMENTS[code as keyof typeof DEPARTEMENTS] ?? code;
}

export function titreFormulaire(code: string): string {
  return formulaireStatistique(code)?.titre ?? code;
}

export function libellePeriodeRapport(code: string, periode: string): string {
  const def = formulaireStatistique(code);
  return def ? libellePeriode(def.periodicite, periode) : periode;
}
