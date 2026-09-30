// D11 — export CSV, RFC 4180 minimal (guillemets systématiques, échappement
// des guillemets internes). Réutilise exactement les données déjà renvoyées
// par EvenementsIndesirablesService.exporter — aucun nouveau modèle, aucune
// donnée supplémentaire chargée.
import type { EvenementIndesirable, Cause, ActionCorrective, TypeEi, Service } from "../generated/prisma/client.js";

type EvenementExportable = EvenementIndesirable & {
  typeEi: TypeEi | null;
  service: Service | null;
  causes: Cause[];
  actionsCorrectives: ActionCorrective[];
};

const ENTETES = [
  "id",
  "date_declaration",
  "type_ei",
  "service",
  "gravite",
  "statut",
  "date_cloture",
  "description",
  "nombre_causes",
  "nombre_actions_correctives",
];

function champCsv(valeur: string): string {
  return `"${valeur.replace(/"/g, '""')}"`;
}

export function evenementsIndesirablesVersCsv(evenements: EvenementExportable[]): string {
  const lignes = evenements.map((e) =>
    [
      e.id,
      e.dateDeclaration.toISOString(),
      e.typeEi?.libelle ?? "",
      e.service?.nom ?? "",
      e.gravite ?? "",
      e.statut,
      e.dateCloture?.toISOString() ?? "",
      e.description,
      String(e.causes.length),
      String(e.actionsCorrectives.length),
    ]
      .map(champCsv)
      .join(","),
  );

  return [ENTETES.map(champCsv).join(","), ...lignes].join("\r\n");
}
