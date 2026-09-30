import Link from "next/link";

// Primitive partagée par les 3 shells (marketing, app, admin) + le layout
// auth — wordmark identique dupliquée 4x avant la Phase 3 de la refonte.
export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-1 font-display text-lg font-bold text-[#0f3d8a] ${className}`}>
      dps<span className="text-accent">.</span>bj
    </Link>
  );
}
