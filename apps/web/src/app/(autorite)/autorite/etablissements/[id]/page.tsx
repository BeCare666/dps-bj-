import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FORMULAIRES_STATISTIQUES } from "@dps/shared";
import { apiFetchJson, silencieux } from "@/lib/api-server";
import { bornesRaccourci, LIBELLES_STRUCTURE } from "@/lib/autorite-filtres";
import { libellePeriodeCourt } from "@/lib/autorite-agregats";
import { formaterDateCourte, formaterDateHeure } from "@/lib/format";
import { LIBELLES_STATUT_RAPPORT, libelleDepartement, libellePeriodeRapport, titreFormulaire } from "@/lib/rapports-statistiques-libelles";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { TableauDonnees, type LigneDonnees } from "@/components/autorite/tableau-donnees";
import { IconCheckCircle, IconClock, IconInbox } from "@/components/icons";
import type { EtablissementAutorite, RapportStatistiqueResume, TransmissionsAutorite } from "@/lib/types";

export const metadata: Metadata = {
  title: "Établissement",
  robots: { index: false, follow: false },
};

function Info({ libelle, valeur }: { libelle: string; valeur: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-faint">{libelle}</dt>
      <dd className="mt-0.5 truncate text-sm text-text">{valeur || "—"}</dd>
    </div>
  );
}

// ROADMAP_ESPACE_AUTORITES.md, étape 5.4 — fiche d'un établissement du ressort.
export default async function EtablissementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const etablissements = await apiFetchJson<EtablissementAutorite[]>("/autorite/etablissements");
  const e = etablissements.find((x) => x.id === id);
  if (!e) notFound();

  const [rapports, ...transmissions] = await Promise.all([
    silencieux(apiFetchJson<RapportStatistiqueResume[]>(`/autorite/rapports?organisationId=${id}`), []),
    ...FORMULAIRES_STATISTIQUES.map((f) => {
      const { du, au } = bornesRaccourci(f.periodicite === "HEBDOMADAIRE" ? "3m" : "12m");
      return silencieux(
        apiFetchJson<TransmissionsAutorite>(`/autorite/transmissions?formulaire=${f.code}&organisations=${id}&du=${du}&au=${au}`),
        null,
      );
    }),
  ]);

  const lignes: LigneDonnees[] = rapports.map((r) => ({
    id: r.id,
    lien: `/autorite/rapports/${r.id}`,
    formulaire: titreFormulaire(r.formulaireCode),
    periode: libellePeriodeRapport(r.formulaireCode, r.periode),
    code: r.periode,
    statut: LIBELLES_STATUT_RAPPORT[r.statut],
    soumisLe: r.soumisLe,
    valideLe: r.valideLe,
  }));

  return (
    <>
      <PageHeader
        surtitre="Établissement"
        titre={e.nom}
        description={[e.commune, e.arrondissement, e.zoneSanitaire ? `zone ${e.zoneSanitaire}` : null, libelleDepartement(e.departement)].filter(Boolean).join(" · ")}
        filAriane={[{ label: "Établissements", href: "/autorite/etablissements" }, { label: e.nom }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Rapports reçus" valeur={`${e.rapports.total}`} sousTexte={`${e.formulaires.length} formulaire${e.formulaires.length > 1 ? "s" : ""} différent${e.formulaires.length > 1 ? "s" : ""}`} icone={IconInbox} />
        <StatCard label="Validés" valeur={`${e.rapports.valides}`} sousTexte={`${e.rapports.soumis} à valider`} icone={IconCheckCircle} ton="success" />
        <StatCard label="Dernière soumission" valeur={e.derniereSoumission ? formaterDateCourte(e.derniereSoumission) : "—"} sousTexte={e.derniereSoumission ? formaterDateHeure(e.derniereSoumission) : "Aucun rapport"} icone={IconClock} ton="neutral" />
      </div>

      <Card className="mt-6">
        <CardHeader titre="Identité et localisation" description={e.localiseDansRessort ? "Localisé dans votre ressort" : "Fiche localisée hors de votre ressort : il y a transmis des rapports"} />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <Info libelle="Catégorie ARS" valeur={e.type} />
          <Info libelle="Type de structure" valeur={e.typeStructure ? LIBELLES_STRUCTURE[e.typeStructure] : null} />
          <Info libelle="Département" valeur={libelleDepartement(e.departement)} />
          <Info libelle="Zone sanitaire" valeur={e.zoneSanitaire} />
          <Info libelle="Commune" valeur={e.commune} />
          <Info libelle="Arrondissement" valeur={e.arrondissement} />
          <Info libelle="Téléphone" valeur={e.telephone} />
          <Info libelle="Email" valeur={e.email} />
        </dl>
      </Card>

      <Card className="mt-6">
        <CardHeader titre="Transmissions par formulaire" description="12 derniers mois (mensuels) · 3 derniers mois (hebdomadaire)" />
        <div className="flex flex-col gap-5">
          {transmissions.map((t, i) => {
            const f = FORMULAIRES_STATISTIQUES[i];
            if (!t) return null;
            const ligne = t.etablissements.find((x) => x.id === id);
            const recus = t.periodes.filter((p) => ligne?.cellules[p]).length;
            return (
              <div key={f.code}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <Link href={`/autorite/transmissions?formulaire=${f.code}&etab=${id}`} className="min-w-0 truncate text-sm font-medium text-text hover:text-primary">
                    {f.titre}
                  </Link>
                  <span className="shrink-0 text-xs tabular-nums text-text-muted">
                    {recus} / {t.periodes.length}
                  </span>
                </div>
                <div className="scrollbar-fin flex gap-1 overflow-x-auto pb-1">
                  {t.periodes.map((p) => {
                    const c = ligne?.cellules[p];
                    const classe = c
                      ? c.statut === "VALIDE"
                        ? "bg-success text-white"
                        : "bg-warning/85 text-white"
                      : "border border-dashed border-border bg-bg-subtle text-text-faint";
                    const contenu = <span className="block truncate px-0.5 text-[0.625rem] leading-6">{libellePeriodeCourt(p).split(" ")[0]}</span>;
                    const titre = `${libellePeriodeCourt(p)} — ${c ? LIBELLES_STATUT_RAPPORT[c.statut].toLowerCase() : "non reçu"}`;
                    return c ? (
                      <Link key={p} href={`/autorite/rapports/${c.id}`} title={titre} className={`h-6 w-10 shrink-0 rounded-[5px] text-center ${classe}`}>
                        {contenu}
                      </Link>
                    ) : (
                      <span key={p} title={titre} className={`h-6 w-10 shrink-0 rounded-[5px] text-center ${classe}`}>
                        {contenu}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6">
        <TableauDonnees
          id="autorite-etablissement-rapports"
          recherche="Rechercher un formulaire, une période…"
          nomExport={`rapports-${e.nom}`}
          lienLigne="lien"
          triParDefaut={{ cle: "soumisLe", direction: "desc" }}
          colonnes={[
            { cle: "formulaire", entete: "Formulaire", filtre: true, lien: "lien" },
            { cle: "periode", entete: "Période", tri: "code" },
            { cle: "statut", entete: "Statut", filtre: true },
            { cle: "soumisLe", entete: "Soumis le", format: "date" },
            { cle: "valideLe", entete: "Validé le", format: "date" },
          ]}
          lignes={lignes}
          vide={{ titre: "Aucun rapport reçu de cet établissement" }}
        />
      </div>
    </>
  );
}
