import { IconGraduationCap, IconHeartPulse, IconOrganisation, IconShieldCheck, IconUsers } from "@/components/icons";
import { TEINTES_DOMAINE, TEINTE_PAR_DEFAUT } from "@/lib/catalogue-formations";
import type { Formation } from "@/lib/types";

const ICONES_DOMAINE = { A: IconOrganisation, B: IconUsers, C: IconHeartPulse, D: IconShieldCheck, E: IconGraduationCap } as const;

// Image de couverture fixée dans l'admin, sinon illustration du domaine ARS.
export function CouvertureFormation({ formation, className = "" }: { formation: Formation; className?: string }) {
  if (formation.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image Cloudinary, dimensions inconnues
      <img src={formation.imageUrl} alt="" className={`h-full w-full object-cover ${className}`} />
    );
  }
  const code = (formation.domaineCode ?? "") as keyof typeof ICONES_DOMAINE;
  const teinte = TEINTES_DOMAINE[code] ?? TEINTE_PAR_DEFAUT;
  const Icone = ICONES_DOMAINE[code] ?? IconGraduationCap;
  return (
    <div aria-hidden="true" className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${teinte.fond} ${className}`}>
      <span className={`absolute -right-8 -top-10 h-36 w-36 rounded-full opacity-30 blur-2xl ${teinte.accent}`} />
      <span className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full border border-white/15" />
      <Icone width={84} height={84} className="absolute -bottom-3 right-3 text-white/15" />
      <span className="absolute left-4 top-4 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
        {formation.critere ?? "DSP"}
      </span>
      {formation.domaine && (
        <span className="absolute bottom-4 left-4 right-16 text-xs font-medium leading-snug text-white/85">{formation.domaine}</span>
      )}
    </div>
  );
}
