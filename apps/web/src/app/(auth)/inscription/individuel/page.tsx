import { permanentRedirect } from "next/navigation";

// Ancienne adresse : l'inscription se fait désormais sur une seule page.
export default function AncienneInscriptionPage() {
  permanentRedirect("/inscription");
}
