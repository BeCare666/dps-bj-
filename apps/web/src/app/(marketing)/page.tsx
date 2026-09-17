import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { IconChecklist, IconVitals, IconShieldAlert, IconGraduationCap, IconArrowRight } from "@/components/icons";
import { HeroPreviewCard } from "@/components/marketing/hero-preview-card";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "dps.bj outille les établissements de santé du Bénin pour l'auto-évaluation qualité, la surveillance NEWS, la déclaration des événements indésirables et la formation continue.",
};

const MODULES = [
  {
    icon: IconChecklist,
    titre: "Auto-évaluation qualité",
    description:
      "Grilles EH/ESPC pas-à-pas, score calculé automatiquement, suivi de la progression dans le temps. Gratuit pour tous les établissements.",
    tag: "Gratuit",
  },
  {
    icon: IconVitals,
    titre: "Score NEWS",
    description:
      "Surveillance clinique au chevet du patient, alerte automatique dès qu'un score franchit un seuil à risque, historique complet par patient.",
    tag: "Essai 3 mois",
  },
  {
    icon: IconShieldAlert,
    titre: "Événements indésirables",
    description:
      "Déclaration en quelques secondes, qualification par le responsable qualité, plan d'actions correctives et tableau de bord de suivi.",
    tag: "Essai 3 mois",
  },
  {
    icon: IconGraduationCap,
    titre: "Formations",
    description:
      "Catalogue de formations à la sécurité des patients, réservation individuelle ou en groupe, paiement en ligne sécurisé.",
    tag: "À l'unité",
  },
];

const ETAPES = [
  {
    numero: "01",
    titre: "Créez votre espace",
    description: "Inscrivez votre établissement (EH ou ESPC) ou votre compte individuel en quelques minutes.",
  },
  {
    numero: "02",
    titre: "Évaluez et surveillez",
    description: "Lancez une auto-évaluation, suivez vos patients au chevet, déclarez les événements indésirables.",
  },
  {
    numero: "03",
    titre: "Progressez",
    description: "Suivez vos indicateurs dans le temps et formez vos équipes pour ancrer les bonnes pratiques.",
  },
];

export default function AccueilPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-bg-subtle">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted">
              Dispositif de Sécurité des Patients — Bénin
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] text-text sm:text-5xl">
              La sécurité des patients,{" "}
              <span className="text-primary">mesurée et suivie</span> au quotidien
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-text-muted">
              dps.bj outille les établissements de santé du Bénin : auto-évaluation qualité, surveillance clinique
              NEWS, déclaration des événements indésirables et formation continue, réunis dans une seule plateforme.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/inscription" variant="primary">
                Créer un compte établissement
                <IconArrowRight width={16} height={16} />
              </Button>
              <Button href="/formations" variant="secondary">
                Voir les formations
              </Button>
            </div>
          </div>

          <HeroPreviewCard />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal className="max-w-xl">
          <h2 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Quatre modules, une seule plateforme
          </h2>
          <p className="mt-3 text-text-muted">
            Chaque module répond à une exigence concrète de la sécurité des patients — commencez par
            l&apos;auto-évaluation, gratuite, puis activez les modules dont votre établissement a besoin.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {MODULES.map((module, i) => (
            <Reveal key={module.titre} delay={i * 0.08}>
              <div className="group h-full rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-primary/30">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                    <module.icon width={22} height={22} />
                  </div>
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                    {module.tag}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-text">{module.titre}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{module.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-bg-subtle">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Reveal className="max-w-xl">
            <h2 className="font-display text-2xl font-bold text-text sm:text-3xl">Comment ça marche</h2>
          </Reveal>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {ETAPES.map((etape, i) => (
              <Reveal key={etape.numero} delay={i * 0.1}>
                <div className="flex flex-col gap-3">
                  <span className="font-display text-3xl font-bold text-primary/25">{etape.numero}</span>
                  <h3 className="font-display text-lg font-semibold text-text">{etape.titre}</h3>
                  <p className="text-sm leading-6 text-text-muted">{etape.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 rounded-[var(--radius-lg)] border border-border bg-surface p-8 sm:p-10 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold text-text">Prêt à démarrer votre auto-évaluation ?</h2>
              <p className="mt-2 max-w-md text-text-muted">
                Gratuite, disponible immédiatement après inscription de votre établissement.
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-3">
              <Button href="/inscription" variant="primary">
                Créer un compte
              </Button>
              <Button href="/login" variant="ghost">
                Se connecter
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
