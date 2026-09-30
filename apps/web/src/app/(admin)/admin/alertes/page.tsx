import type { Metadata } from "next";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { Reveal } from "@/components/motion/reveal";
import { AlertesTable } from "@/components/admin/alertes-table";
import type { LigneAlertePlateforme } from "@/lib/types";

export const metadata: Metadata = {
  title: "Administration · Alertes",
  robots: { index: false, follow: false },
};

async function silencieux<T>(promesse: Promise<T>, repli: T): Promise<T> {
  try {
    return await promesse;
  } catch (erreur) {
    if (erreur instanceof ApiError) return repli;
    throw erreur;
  }
}

export default async function AdminAlertesPage() {
  const donnees = await silencieux(
    apiFetchJson<{ lignes: LigneAlertePlateforme[]; totalNews: number; totalEi: number }>("/alertes-plateforme"),
    { lignes: [], totalNews: 0, totalEi: 0 },
  );

  return (
    <div>
      <Reveal>
        <p className="mb-2 text-sm text-text-muted">
          Vue agrégée de tous les établissements : alertes NEWS de niveau moyen ou élevé non clôturées et
          événements indésirables de gravité élevée non clôturés. Aucune donnée patient ni description d&apos;incident
          n&apos;est affichée ici, uniquement des comptages par établissement.
        </p>
        <p className="mb-6 text-sm font-medium text-text">
          {donnees.totalNews} alerte{donnees.totalNews > 1 ? "s" : ""} NEWS · {donnees.totalEi} événement
          {donnees.totalEi > 1 ? "s" : ""} indésirable{donnees.totalEi > 1 ? "s" : ""} de gravité élevée
        </p>
      </Reveal>
      <AlertesTable lignes={donnees.lignes} />
    </div>
  );
}
