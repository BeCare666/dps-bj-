import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnTetePage } from "@/components/marketing/page-vitrine";
import { DOMAINES_STATISTIQUES } from "@/lib/navigation-vitrine";

// Espace de transmission des statistiques au ministère, un par domaine.
// Le formulaire de transmission sera ajouté une fois son contenu fourni par le client.

function trouverDomaine(slug: string) {
  return DOMAINES_STATISTIQUES.find((d) => d.slug === slug);
}

export function generateStaticParams() {
  return DOMAINES_STATISTIQUES.map((d) => ({ domaine: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ domaine: string }> }): Promise<Metadata> {
  const domaine = trouverDomaine((await params).domaine);
  if (!domaine) return {};
  return {
    title: `Statistiques : ${domaine.label}`,
    description: `Transmission des statistiques « ${domaine.label} » au ministère de la Santé.`,
  };
}

export default async function StatistiquesDomainePage({ params }: { params: Promise<{ domaine: string }> }) {
  const domaine = trouverDomaine((await params).domaine);
  if (!domaine) notFound();

  return (
    <EnTetePage
      fil={[{ href: "/", label: "Accueil" }]}
      surTitre="Statistiques"
      titre={domaine.label}
      description="Espace de transmission des statistiques des établissements de santé au ministère de la Santé."
      badge="Bientôt disponible"
    />
  );
}
