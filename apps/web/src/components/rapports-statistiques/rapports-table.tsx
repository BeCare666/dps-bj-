import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formaterDateHeure } from "@/lib/format";
import {
  LIBELLES_STATUT_RAPPORT,
  VARIANTES_STATUT_RAPPORT,
  libelleDepartement,
  libellePeriodeRapport,
  titreFormulaire,
} from "@/lib/rapports-statistiques-libelles";
import type { RapportStatistiqueResume } from "@/lib/types";

// Liste des rapports statistiques — côté établissement (sans colonne
// établissement) ou côté autorité sanitaire (avec).
export function RapportsTable({
  rapports,
  lienBase,
  avecEtablissement = false,
}: {
  rapports: RapportStatistiqueResume[];
  lienBase: string;
  avecEtablissement?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-bg-subtle text-xs uppercase tracking-wide text-text-muted">
          <tr>
            {avecEtablissement && <th className="px-4 py-3 font-semibold">Établissement</th>}
            <th className="px-4 py-3 font-semibold">Formulaire</th>
            <th className="px-4 py-3 font-semibold">Période</th>
            {avecEtablissement && <th className="px-4 py-3 font-semibold">Département / zone</th>}
            <th className="px-4 py-3 font-semibold">Statut</th>
            <th className="px-4 py-3 font-semibold">Transmis le</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rapports.map((r) => (
            <tr key={r.id} className="hover:bg-bg-subtle/60">
              {avecEtablissement && <td className="px-4 py-3 font-medium text-text">{r.organisation.nom}</td>}
              <td className="px-4 py-3 text-text">{titreFormulaire(r.formulaireCode)}</td>
              <td className="px-4 py-3 text-text-muted">{libellePeriodeRapport(r.formulaireCode, r.periode)}</td>
              {avecEtablissement && (
                <td className="px-4 py-3 text-text-muted">
                  {libelleDepartement(r.departement)}
                  {r.entete.zoneSanitaire ? ` / ${r.entete.zoneSanitaire}` : ""}
                </td>
              )}
              <td className="px-4 py-3">
                <Badge variant={VARIANTES_STATUT_RAPPORT[r.statut]}>{LIBELLES_STATUT_RAPPORT[r.statut]}</Badge>
              </td>
              <td className="px-4 py-3 text-text-muted">{r.soumisLe ? formaterDateHeure(r.soumisLe) : "—"}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`${lienBase}/${r.id}`} className="text-sm font-medium text-primary hover:underline">
                  {r.statut === "BROUILLON" ? "Continuer" : "Consulter"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
