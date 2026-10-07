"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { validerRapportAction } from "@/lib/rapports-statistiques-actions";

// Zone sanitaire destinataire : validation d'un rapport soumis.
export function ValiderBouton({ rapportId }: { rapportId: string }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider() {
    const resultat = await validerRapportAction(rapportId);
    if (resultat.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" onClick={() => setOuvert(true)}>
        Valider le rapport
      </Button>
      {erreur && <p className="text-sm text-danger">{erreur}</p>}
      <ConfirmDialog
        open={ouvert}
        onClose={() => setOuvert(false)}
        onConfirm={valider}
        titre="Valider ce rapport ?"
        description="L'établissement et les autres autorités verront le rapport comme validé par votre zone sanitaire."
        confirmLabel="Valider"
        danger={false}
      />
    </div>
  );
}
