"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { CouvertureFormation } from "@/components/formations/couverture-formation";
import { definirImageFormationAction, retirerImageFormationAction, type EtatAction } from "@/lib/admin-actions";
import type { Formation } from "@/lib/types";

function Envoyer() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm font-medium text-text hover:border-primary/40 disabled:opacity-50">
      {pending ? "Envoi…" : "Enregistrer l'image"}
    </button>
  );
}

// §3.2 — image de couverture ; sans image, l'illustration du domaine s'affiche.
// L'aperçu suit l'image enregistrée après rechargement de la liste.
export function ImageFormation({ formation }: { formation: Formation }) {
  const [etat, formAction] = useActionState<EtatAction, FormData>(definirImageFormationAction.bind(null, formation.id), {});
  const [retrait, setRetrait] = useState<EtatAction>({});
  const [enCours, demarrer] = useTransition();
  return (
    <div className="mb-6 grid gap-4 rounded-[var(--radius-md)] border border-border p-4 sm:grid-cols-[12rem_1fr]">
      <div className="h-28 overflow-hidden rounded-[var(--radius-md)]">
        <CouvertureFormation formation={formation} />
      </div>
      <form action={formAction} className="flex flex-col gap-2">
        <p className="text-sm font-medium text-text">Image de couverture</p>
        <input type="file" name="fichier" accept="image/jpeg,image/png,image/webp" className="text-sm text-text-muted" />
        <div className="flex flex-wrap items-center gap-3">
          <Envoyer />
          {formation.imageUrl && (
            <button
              type="button"
              disabled={enCours}
              onClick={() => demarrer(async () => setRetrait(await retirerImageFormationAction(formation.id)))}
              className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
            >
              Retirer l&apos;image
            </button>
          )}
        </div>
        {(etat.erreur || retrait.erreur) && <p className="text-sm text-danger">{etat.erreur ?? retrait.erreur}</p>}
        {(etat.succes || retrait.succes) && <p className="text-sm text-success">Image mise à jour.</p>}
        <p className="text-xs text-text-faint">JPEG, PNG ou WebP, 4 Mo au plus.</p>
      </form>
    </div>
  );
}
