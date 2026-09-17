import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "dps.bj — Dispositif de Sécurité des Patients",
    template: "%s · dps.bj",
  },
  description:
    "Plateforme de sécurité des patients pour les établissements de santé au Bénin : auto-évaluation, surveillance NEWS, événements indésirables et formations.",
  keywords: [
    "sécurité des patients",
    "qualité des soins",
    "santé Bénin",
    "auto-évaluation hospitalière",
    "score NEWS",
    "événements indésirables",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "dps.bj",
    title: "dps.bj — Dispositif de Sécurité des Patients",
    description:
      "Auto-évaluation, surveillance NEWS, événements indésirables et formations pour les établissements de santé au Bénin.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#1657cc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-bg text-text">{children}</body>
    </html>
  );
}
