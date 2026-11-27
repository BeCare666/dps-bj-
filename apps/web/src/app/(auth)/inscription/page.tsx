import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterOrganisationForm } from "@/components/auth/register-organisation-form";

export const metadata: Metadata = {
  title: "Inscription",
};

// Une seule inscription : celle de l'établissement de santé (EH ou ESPC) et de
// son responsable. L'option « compte individuel » a été retirée.
export default function InscriptionPage() {
  return (
    <AuthCard
      title="Inscription"
      description="Renseignez les informations de votre établissement et de son responsable."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <RegisterOrganisationForm />
    </AuthCard>
  );
}
