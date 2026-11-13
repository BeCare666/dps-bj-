import type { Metadata } from "next";
import Link from "next/link";
import { FORMULAIRES_STATISTIQUES, formulaireStatistique } from "@dps/shared";
import { apiFetchJson } from "@/lib/api-server";
import { contexteAutorite, optionsEtablissements } from "@/lib/autorite-serveur";
import { requeteApi, resumeFiltres, type ParametresUrl } from "@/lib/autorite-filtres";
import { formaterNombre, libellePeriodeCourt, pourcentage, formaterPourcentage } from "@/lib/autorite-agregats";
import { formaterDateHeure } from "@/lib/format";
import { libellePeriodeRapport, titreFormulaire } from "@/lib/rapports-statistiques-libelles";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { FiltresBarre } from "@/components/autorite/filtres-barre";
import { GraphiqueBarres } from "@/components/autorite/graphiques";
import { Barre, Formule, ressortAutorite, surtitreAutorite } from "@/components/autorite/elements";
import { IconCheckCircle, IconClock, IconHospital, IconInbox, IconArrowRight, IconEye } from "@/components/icons";
import { COULEURS } from "@/lib/chart-theme";
import type { StatistiqueDelai, SyntheseAutorite } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false, follow: false },
};

function jours(v: number | null): string {
  if (v === null) return "—";
  return `${formaterNombre(v)} j`;
}

function LigneDelai({ titre, delai, explication }: { titre: string; delai: StatistiqueDelai; explication: string }) {
  return (
    <li className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-text">{titre}</span>
        <span className="font-display text-lg font-semibold text-text tabular-nums">{jours(delai.mediane)}</span>
      </div>
      <p className="text-xs text-text-muted">
        Médiane · moyenne {jours(delai.moyenne)} · sur {delai.n} rapport{delai.n > 1 ? "s" : ""}
      </p>
      <Formule>{explication}</Formule>
    </li>
  );
}

export default async function AutoriteTableauDeBordPage({ searchParams }: { searchParams: Promise<ParametresUrl> }) {
  const { autorite, etablissements, filtres, noms } = await contexteAutorite(searchParams);
  const synthese = await apiFetchJson<SyntheseAutorite>(`/autorite/synthese?${requeteApi(filtres)}`);
  const { totaux } = synthese;
  const resume = resumeFiltres(filtres, noms);

  const parMois = synthese.parMois.map((m) => ({
    libelle: libellePeriodeCourt(m.mois),
    valides: m.valides,
    aValider: m.soumis - m.valides,
  }));
  const parFormulaire = synthese.parFormulaire.map((f) => ({
    libelle: titreFormulaire(f.code),
    valides: f.valides,
    aValider: f.aValider,
  }));
  const tauxTransmission = pourcentage(totaux.etablissementsAyantTransmis, totaux.etablissementsRessort);

  return (
    <>
      <PageHeader
        surtitre={surtitreAutorite(autorite)}
        titre="Tableau de bord"
        description={`Rapports statistiques reçus des établissements de votre ressort : ${ressortAutorite(autorite)}.`}
      />
      <FiltresBarre etablissements={optionsEtablissements(etablissements)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rapports reçus"
          valeur={formaterNombre(totaux.recus)}
          sousTexte={`${totaux.aValider} à valider · ${totaux.valides} validé${totaux.valides > 1 ? "s" : ""}`}
          icone={IconInbox}
          href="/autorite/rapports"
        />
        <StatCard
          label="À valider"
          valeur={formaterNombre(totaux.aValider)}
          sousTexte={autorite.niveau === "ZONE_SANITAIRE" ? "Rapports soumis en attente de votre validation" : "Validation par la zone sanitaire"}
          icone={IconCheckCircle}
          ton={totaux.aValider > 0 ? "warning" : "success"}
          href="/autorite/rapports?statut=SOUMIS"
        />
        <StatCard
          label="Non encore ouverts"
          valeur={formaterNombre(totaux.nonOuverts)}
          sousTexte="Soumis, jamais consultés par la zone sanitaire"
          icone={IconEye}
          ton={totaux.nonOuverts > 0 ? "info" : "neutral"}
        />
        <StatCard
          label="Établissements ayant transmis"
          valeur={`${totaux.etablissementsAyantTransmis} / ${totaux.etablissementsRessort}`}
          sousTexte={
            <Formule>
              établissements ayant transmis au moins un rapport ÷ établissements localisés dans le ressort ={" "}
              {formaterPourcentage(tauxTransmission)}
            </Formule>
          }
          icone={IconHospital}
          ton="info"
          href="/autorite/etablissements"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader titre="Rapports reçus par mois de soumission" description={resume} />
          <GraphiqueBarres
            donnees={parMois}
            cleX="libelle"
            empile
            series={[
              { cle: "valides", label: "Validés", couleur: COULEURS.success },
              { cle: "aValider", label: "À valider", couleur: COULEURS.warning },
            ]}
          />
        </Card>
        <Card>
          <CardHeader titre="Délais" description="Mesurés sur les dates enregistrées" />
          <ul className="flex flex-col gap-3">
            <LigneDelai
              titre="Transmission"
              delai={synthese.delais.finPeriodeSoumission}
              explication="date de soumission − fin de la période du rapport (négatif : soumis avant la fin)"
            />
            <LigneDelai titre="Réception" delai={synthese.delais.soumissionReception} explication="première consultation par la zone − soumission" />
            <LigneDelai titre="Validation" delai={synthese.delais.soumissionValidation} explication="validation par la zone − soumission" />
          </ul>
          <p className="mt-4 flex items-start gap-2 text-xs text-text-faint">
            <IconClock width={14} height={14} className="mt-0.5 shrink-0" />
            Aucune date limite de transmission n&apos;a été fournie : les délais sont affichés sans appréciation « à temps / en retard ».
          </p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader titre="Rapports par formulaire" description={resume} />
          <GraphiqueBarres
            donnees={parFormulaire}
            cleX="libelle"
            horizontal
            empile
            series={[
              { cle: "valides", label: "Validés", couleur: COULEURS.success },
              { cle: "aValider", label: "À valider", couleur: COULEURS.warning },
            ]}
          />
        </Card>
        <Card>
          <CardHeader titre="Dernière période complète" description="Établissements ayant transmis, par formulaire" />
          <ul className="flex flex-col gap-4">
            {synthese.dernieresPeriodes.map((p) => {
              const def = formulaireStatistique(p.code);
              return (
                <li key={p.code}>
                  <Link href={`/autorite/transmissions?formulaire=${p.code}`} className="group block">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium text-text group-hover:text-primary">{def?.titre ?? p.code}</span>
                      <span className="shrink-0 tabular-nums text-text-muted">
                        {p.transmis} / {p.etablissements}
                      </span>
                    </div>
                    <p className="mb-1.5 text-xs text-text-faint">{libellePeriodeRapport(p.code, p.periode)}</p>
                    <Barre valeur={p.transmis} max={p.etablissements} ton={p.transmis === p.etablissements && p.etablissements > 0 ? "bg-success" : "bg-primary"} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-text-faint">
            Base : établissements de la plateforme localisés dans votre ressort. La liste officielle des établissements attendus par formulaire n&apos;a pas été fournie.
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          titre="Plus anciens rapports à valider"
          description={`${totaux.aValider} au total`}
          action={
            <Link href="/autorite/rapports?statut=SOUMIS" className="text-xs font-medium text-primary hover:underline">
              Tout voir
            </Link>
          }
        />
        {synthese.aValiderListe.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-success-soft/60 px-4 py-4 text-sm text-success">
            <IconCheckCircle width={18} height={18} />
            Aucun rapport en attente de validation.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {synthese.aValiderListe.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/autorite/rapports/${r.id}`}
                  className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-bg-subtle/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">{r.organisation.nom}</span>
                    <span className="block truncate text-xs text-text-muted">
                      {titreFormulaire(r.formulaireCode)} · {libellePeriodeRapport(r.formulaireCode, r.periode)}
                    </span>
                    <span className="block text-xs text-text-faint">
                      Soumis le {r.soumisLe ? formaterDateHeure(r.soumisLe) : "—"}
                      {r.recuLe ? "" : " · non ouvert"}
                    </span>
                  </span>
                  <IconArrowRight width={16} height={16} className="shrink-0 text-text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-6 text-xs text-text-faint">
        {FORMULAIRES_STATISTIQUES.length} formulaires suivis. Seuls les rapports soumis ou validés de votre ressort sont comptés ; un brouillon n&apos;est jamais visible.
      </p>
    </>
  );
}
