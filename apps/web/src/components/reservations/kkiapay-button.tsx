"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { verifierPaiementAction } from "@/lib/reservations-actions";

declare global {
  interface Window {
    openKkiapayWidget?: (options: {
      amount: number;
      key: string;
      sandbox: boolean;
      position?: "left" | "right" | "center";
      theme?: string;
      data?: string;
    }) => void;
    addSuccessListener?: (callback: (response: { transactionId: string }) => void) => void;
    addFailedListener?: (callback: (error: unknown) => void) => void;
  }
}

const CLE_PUBLIQUE = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY ?? "";
const SANDBOX = process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX !== "false";

export function KkiapayButton({ reservationId, montant }: { reservationId: string; montant: number }) {
  const router = useRouter();
  const [scriptPret, setScriptPret] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const inscrit = useRef(false);

  useEffect(() => {
    if (!scriptPret || inscrit.current || !window.addSuccessListener || !window.addFailedListener) return;
    inscrit.current = true;

    window.addSuccessListener(async (response) => {
      setEnCours(true);
      const resultat = await verifierPaiementAction(reservationId, response.transactionId);
      setEnCours(false);
      if (resultat.erreur) {
        setErreur(resultat.erreur);
        return;
      }
      router.refresh();
    });

    window.addFailedListener(() => {
      setErreur("Le paiement a été annulé ou a échoué.");
    });
  }, [scriptPret, reservationId, router]);

  function ouvrirWidget() {
    setErreur(undefined);
    window.openKkiapayWidget?.({
      amount: montant,
      key: CLE_PUBLIQUE,
      sandbox: SANDBOX,
      position: "center",
      theme: "#1657CC",
      data: reservationId,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Script src="https://cdn.kkiapay.me/k.js" strategy="afterInteractive" onReady={() => setScriptPret(true)} />
      <button
        type="button"
        onClick={ouvrirWidget}
        disabled={!scriptPret || enCours || !CLE_PUBLIQUE}
        className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {enCours ? "Vérification du paiement…" : !scriptPret ? "Chargement du paiement…" : "Payer maintenant"}
      </button>
      {erreur && <p className="text-sm text-danger">{erreur}</p>}
    </div>
  );
}
