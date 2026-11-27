import Image from "next/image";
import Link from "next/link";

// Symbole DSP : l'écu du logo officiel (mise_a_jour/Logo DSP.png), extrait tel
// quel sur fond transparent (public/logo-dsp-ecu.png). Le logo complet, avec
// son texte circulaire, est dans public/logo-dsp.png ; le favicon et les icônes
// (app/icon.png, app/favicon.ico, app/apple-icon.png) reprennent le même écu.
export function LogoSymbole({ className = "" }: { className?: string }) {
  return <Image src="/logo-dsp-ecu.png" alt="" aria-hidden="true" width={246} height={310} className={`object-contain ${className}`} />;
}

interface LogoProps {
  href?: string;
  className?: string;
  // "clair" : sur fond blanc (défaut). "sombre" : sur les surfaces bleu nuit (footer).
  variante?: "clair" | "sombre";
}

// Primitive partagée par les shells (vitrine, établissement, admin) et le
// layout d'authentification.
export function Logo({ href = "/", className = "", variante = "clair" }: LogoProps) {
  const sombre = variante === "sombre";

  return (
    <Link href={href} aria-label="DSP, Dispositif de Sécurité des Patients, accueil" className={`group flex items-center gap-2.5 ${className}`}>
      <LogoSymbole className="h-9 w-9 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.2rem] font-extrabold tracking-[0.04em] ${sombre ? "text-white" : "text-navy"}`}>
          DSP
        </span>
        <span
          className={`mt-1 whitespace-nowrap text-[0.56rem] font-semibold uppercase tracking-[0.13em] ${sombre ? "text-white/55" : "text-text-faint"}`}
        >
          Sécurité des patients
        </span>
      </span>
    </Link>
  );
}
