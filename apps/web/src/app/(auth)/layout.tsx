import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-bg-subtle">
      <header className="px-5 py-6 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-1 font-display text-lg font-bold text-[#0f3d8a]">
          dps<span className="text-accent">.</span>bj
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
