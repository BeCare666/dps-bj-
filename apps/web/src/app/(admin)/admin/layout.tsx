import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { aRole } from "@/lib/session";
import { apiFetchJson, ApiError } from "@/lib/api-server";
import { AdminShell } from "@/components/admin/admin-shell";
import type { NotificationInterne, UtilisateurProfil } from "@/lib/types";

async function silencieux<T>(promesse: Promise<T>, repli: T): Promise<T> {
  try {
    return await promesse;
  } catch (erreur) {
    if (erreur instanceof ApiError) return repli;
    throw erreur;
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const estAdmin = await aRole("ADMIN_PLATEFORME");
  if (!estAdmin) redirect("/tableau-de-bord");

  const [profil, notifications, { nombre }] = await Promise.all([
    apiFetchJson<UtilisateurProfil>("/auth/me/profil"),
    silencieux(apiFetchJson<NotificationInterne[]>("/notifications-internes"), []),
    silencieux(apiFetchJson<{ nombre: number }>("/notifications-internes/non-lues/nombre"), { nombre: 0 }),
  ]);

  return (
    <AdminShell profil={profil} notificationsInitiales={notifications} nombreNonLuesInitial={nombre}>
      {children}
    </AdminShell>
  );
}
