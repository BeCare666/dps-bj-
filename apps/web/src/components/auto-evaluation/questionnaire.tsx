"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { motion } from "motion/react";
import { enregistrerPositionAction, enregistrerReponseAction, soumettreSessionAction } from "@/lib/session-actions";
import type { SessionEvaluation, TypeElementMesurable } from "@/lib/types";

type ValeurReponse = string | undefined;

// Réponses d'un élément « Présent / Absent / Observations » (typeReponse OUI_NON).
const PRESENT = "PRESENT";
const ABSENT = "ABSENT";
const OBSERVATION = "OBSERVATION";

const OPTIONS_PRESENCE = [
  { valeur: PRESENT, label: "Présent" },
  { valeur: ABSENT, label: "Absent" },
  { valeur: OBSERVATION, label: "Observations" },
] as const;

// Délai avant l'enregistrement du texte d'une observation pendant la frappe.
const DELAI_ENREGISTREMENT_TEXTE_MS = 700;

// Reprise exacte : la position est aussi gardée dans le navigateur, de façon
// immédiate. L'enregistrement serveur peut ne pas aboutir si la page est
// quittée juste après un clic ; au retour, la plus récente des deux l'emporte.
const clePosition = (sessionId: string) => `dps:auto-evaluation:position:${sessionId}`;

function lirePositionLocale(sessionId: string): { position: number; le: number } | null {
  try {
    const brut = window.localStorage.getItem(clePosition(sessionId));
    const valeur = brut ? (JSON.parse(brut) as { position?: unknown; le?: unknown }) : null;
    return valeur && typeof valeur.position === "number" && typeof valeur.le === "number" ? { position: valeur.position, le: valeur.le } : null;
  } catch {
    return null;
  }
}

function ecrirePositionLocale(sessionId: string, position: number) {
  try {
    window.localStorage.setItem(clePosition(sessionId), JSON.stringify({ position, le: Date.now() }));
  } catch {
    // Stockage indisponible (navigation privée stricte) : la position serveur suffit.
  }
}

interface Question {
  index: number;
  elementId: string;
  libelle: string;
  typeReponse: "OUI_NON" | "TEXTE" | "CHOIX";
  optionsChoix: string[] | null;
  typeElement: TypeElementMesurable;
  entreDansScore: boolean;
  domaineId: string;
  domaineNom: string;
  normeCode: string;
  normeLibelle: string;
  critereCode: string;
  critereLibelle: string;
  critereRegistre: string | null;
}

const LIBELLES_TYPE_ELEMENT: Record<TypeElementMesurable, string> = {
  DOCUMENT_A_EXAMINER: "Document à examiner",
  ENTRETIEN: "Élément d'entretien",
  OBSERVATION: "Élément d'observation",
};

// §6.2 — parcours guidé domaine par domaine, une question (élément
// mesurable) à la fois, dans l'ordre de la grille officielle.
function aplatir(session: SessionEvaluation): Question[] {
  const questions: Question[] = [];
  for (const domaine of session.grille.domaines ?? []) {
    for (const norme of domaine.normes) {
      for (const critere of norme.criteres) {
        for (const element of critere.elementsMesurables) {
          questions.push({
            index: questions.length,
            elementId: element.id,
            libelle: element.libelle,
            typeReponse: element.typeReponse,
            optionsChoix: element.optionsChoix,
            typeElement: element.typeElement ?? "DOCUMENT_A_EXAMINER",
            entreDansScore: element.entreDansScore ?? true,
            domaineId: domaine.id,
            domaineNom: domaine.nom,
            normeCode: norme.code,
            normeLibelle: norme.libelle,
            critereCode: critere.code,
            critereLibelle: critere.libelle,
            critereRegistre: critere.registre ?? null,
          });
        }
      }
    }
  }
  return questions;
}

// Réponses booléennes des sessions démarrées avant le passage à
// « Présent / Absent / Observations » : true = présent, false = absent.
function normaliser(valeur: unknown): ValeurReponse {
  if (valeur === true) return PRESENT;
  if (valeur === false) return ABSENT;
  return typeof valeur === "string" ? valeur : undefined;
}

function estRepondu(v: ValeurReponse): boolean {
  return v !== undefined && v !== "";
}

export function Questionnaire({ session }: { session: SessionEvaluation }) {
  const questions = useMemo(() => aplatir(session), [session]);
  const [reponses, setReponses] = useState<Record<string, ValeurReponse>>(() => {
    const etat: Record<string, ValeurReponse> = {};
    for (const r of session.reponses) etat[r.elementMesurableId] = normaliser(r.valeur);
    return etat;
  });
  const [commentaires, setCommentaires] = useState<Record<string, string>>(() => {
    const etat: Record<string, string> = {};
    for (const r of session.reponses) if (r.commentaire) etat[r.elementMesurableId] = r.commentaire;
    return etat;
  });
  // §6.2 — reprise exacte : la question affichée en dernier ; à défaut
  // (session démarrée avant cet enregistrement), la première sans réponse.
  const [courante, setCourante] = useState(() => {
    const position = session.positionQuestion;
    if (position !== null && position !== undefined && position >= 0 && position <= questions.length) return position;
    const premiere = questions.findIndex((q) => !estRepondu(reponses[q.elementId]));
    return premiere === -1 ? questions.length : premiere;
  });
  const [brouillonTexte, setBrouillonTexte] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | undefined>();
  const [pendingSoumission, startSoumission] = useTransition();
  // Texte d'observation pas encore envoyé (frappe en cours).
  const texteEnAttente = useRef<{ elementId: string; texte: string; minuteur: ReturnType<typeof setTimeout> } | null>(null);

  const nombreRepondus = questions.filter((q) => estRepondu(reponses[q.elementId])).length;
  const progression = questions.length > 0 ? Math.round((nombreRepondus / questions.length) * 100) : 0;
  const question = questions[courante];
  const domaines = useMemo(() => {
    const liste: { id: string; nom: string; premiere: number; total: number }[] = [];
    for (const q of questions) {
      const d = liste.find((x) => x.id === q.domaineId);
      if (d) d.total++;
      else liste.push({ id: q.domaineId, nom: q.domaineNom, premiere: q.index, total: 1 });
    }
    return liste;
  }, [questions]);

  // Position locale plus récente que la dernière mise à jour serveur de la
  // session (même appareil, enregistrement serveur interrompu) : elle l'emporte.
  useEffect(() => {
    const locale = lirePositionLocale(session.id);
    if (!locale || locale.position < 0 || locale.position > questions.length) return;
    if (locale.le > Date.parse(session.updatedAt) && locale.position !== courante) {
      setCourante(locale.position);
      void enregistrerPositionAction(session.id, locale.position);
    }
    // Lecture unique à l'ouverture de la session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  // Le texte en cours de frappe est envoyé si la page est quittée.
  useEffect(() => {
    return () => {
      const attente = texteEnAttente.current;
      if (attente) {
        clearTimeout(attente.minuteur);
        void enregistrerReponseAction(session.id, attente.elementId, OBSERVATION, attente.texte);
      }
    };
  }, [session.id]);

  async function envoyerTexteEnAttente() {
    const attente = texteEnAttente.current;
    if (!attente) return;
    clearTimeout(attente.minuteur);
    texteEnAttente.current = null;
    const resultat = await enregistrerReponseAction(session.id, attente.elementId, OBSERVATION, attente.texte);
    if (!resultat.succes) setErreur(resultat.erreur);
  }

  function aller(index: number) {
    void envoyerTexteEnAttente();
    setBrouillonTexte(null);
    setErreur(undefined);
    const cible = Math.max(0, Math.min(index, questions.length));
    setCourante(cible);
    // Mémorisée dans le navigateur et côté serveur : au retour, la session
    // rouvre sur cette question.
    ecrirePositionLocale(session.id, cible);
    void enregistrerPositionAction(session.id, cible);
  }

  async function repondre(valeur: ValeurReponse, avancer: boolean, commentaire?: string) {
    if (!question) return;
    setReponses((prev) => ({ ...prev, [question.elementId]: valeur }));
    setEnregistrement(true);
    const resultat = await enregistrerReponseAction(session.id, question.elementId, valeur, commentaire);
    setEnregistrement(false);
    if (!resultat.succes) {
      setErreur(resultat.erreur);
      return;
    }
    if (avancer) aller(courante + 1);
  }

  function choisirPresence(valeur: string) {
    if (!question) return;
    // Un texte d'observation en attente ne doit pas écraser la nouvelle réponse.
    if (texteEnAttente.current?.elementId === question.elementId) {
      clearTimeout(texteEnAttente.current.minuteur);
      texteEnAttente.current = null;
    }
    if (valeur === OBSERVATION) {
      // Pas d'avance automatique : la personne peut saisir son observation.
      void repondre(OBSERVATION, false, commentaires[question.elementId]);
      return;
    }
    void repondre(valeur, true);
  }

  function saisirObservation(texte: string) {
    if (!question) return;
    const elementId = question.elementId;
    setCommentaires((prev) => ({ ...prev, [elementId]: texte }));
    if (texteEnAttente.current) clearTimeout(texteEnAttente.current.minuteur);
    texteEnAttente.current = {
      elementId,
      texte,
      minuteur: setTimeout(() => void envoyerTexteEnAttente(), DELAI_ENREGISTREMENT_TEXTE_MS),
    };
  }

  function soumettre() {
    startSoumission(async () => {
      await envoyerTexteEnAttente();
      const resultat = await soumettreSessionAction(session.id);
      if (resultat?.erreur) setErreur(resultat.erreur);
    });
  }

  const sansReponse = questions.filter((q) => !estRepondu(reponses[q.elementId]));
  const nombreObservations = questions.filter((q) => reponses[q.elementId] === OBSERVATION).length;

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-5 py-10 sm:px-8">
      {/* §6.2 — plan de navigation latéral */}
      <aside className="hidden w-60 flex-shrink-0 lg:block">
        <nav className="sticky top-24 flex flex-col gap-1">
          {domaines.map((d) => {
            const repondus = questions.filter((q) => q.domaineId === d.id && estRepondu(reponses[q.elementId])).length;
            const actif = question?.domaineId === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => aller(d.premiere)}
                className={`flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-colors ${
                  actif ? "bg-primary-soft font-medium text-primary" : "text-text-muted hover:bg-bg-subtle hover:text-text"
                }`}
              >
                <span className="min-w-0 truncate">{d.nom}</span>
                <span className="shrink-0 text-xs tabular-nums">
                  {repondus}/{d.total}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => aller(questions.length)}
            className={`mt-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-colors ${
              courante === questions.length ? "bg-primary-soft font-medium text-primary" : "text-text-muted hover:bg-bg-subtle"
            }`}
          >
            Récapitulatif et soumission
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* §6.2 — progression visible à tout moment */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text">{session.grille.nom}</span>
            <span className="text-text-muted tabular-nums">
              {nombreRepondus} / {questions.length} répondues
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progression}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        {question ? (
          <div key={question.elementId} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
              Question {courante + 1} sur {questions.length} · {question.domaineNom}
            </p>
            <p className="mt-3 text-xs text-text-muted">
              Norme {question.normeCode} — {question.normeLibelle}
            </p>
            <p className="mt-1 text-sm font-medium text-text">
              Critère {question.critereCode} — {question.critereLibelle}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-medium text-text-muted">
                {LIBELLES_TYPE_ELEMENT[question.typeElement]}
              </span>
              {question.critereRegistre && (
                <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs text-text-faint">{question.critereRegistre}</span>
              )}
              {!question.entreDansScore && (
                <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs text-text-faint">N&apos;entre pas dans le score</span>
              )}
            </div>
            <h2 className="mt-3 whitespace-pre-line font-display text-xl font-semibold text-text">{question.libelle}</h2>

            <div className="mt-6">
              {question.typeReponse === "OUI_NON" && (
                <>
                  <div className="flex flex-wrap gap-3">
                    {OPTIONS_PRESENCE.map((option) => (
                      <button
                        key={option.valeur}
                        type="button"
                        disabled={enregistrement}
                        aria-pressed={reponses[question.elementId] === option.valeur}
                        onClick={() => choisirPresence(option.valeur)}
                        className={`min-w-28 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
                          reponses[question.elementId] === option.valeur
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-bg text-text hover:border-primary/40"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {reponses[question.elementId] === OBSERVATION && (
                    <div className="mt-5">
                      <label htmlFor={`observation-${question.elementId}`} className="text-sm font-medium text-text">
                        Observations
                      </label>
                      <p className="mt-0.5 text-xs text-text-muted">Cet élément n&apos;est pas pris en compte dans le calcul du score.</p>
                      <textarea
                        id={`observation-${question.elementId}`}
                        rows={3}
                        maxLength={2000}
                        value={commentaires[question.elementId] ?? ""}
                        onChange={(e) => saisirObservation(e.target.value)}
                        onBlur={() => void envoyerTexteEnAttente()}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2.5 text-sm text-text"
                      />
                    </div>
                  )}
                </>
              )}

              {question.typeReponse === "CHOIX" && question.optionsChoix && (
                <select
                  value={reponses[question.elementId] ?? ""}
                  onChange={(e) => repondre(e.target.value, false)}
                  className="w-full max-w-md rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2.5 text-sm text-text"
                >
                  <option value="">Sélectionner…</option>
                  {question.optionsChoix.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {question.typeReponse === "TEXTE" && (
                <textarea
                  rows={3}
                  value={brouillonTexte ?? reponses[question.elementId] ?? ""}
                  onChange={(e) => setBrouillonTexte(e.target.value)}
                  // Enregistré à la sortie du champ, pas à chaque frappe.
                  onBlur={() => {
                    if (brouillonTexte !== null && brouillonTexte !== reponses[question.elementId]) {
                      void repondre(brouillonTexte, false);
                    }
                  }}
                  className="w-full rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
              )}
            </div>

            {enregistrement && <p className="mt-3 text-xs text-text-faint">Enregistrement…</p>}
            {erreur && <p className="mt-3 text-sm text-danger">{erreur}</p>}

            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
              <button
                type="button"
                onClick={() => aller(courante - 1)}
                disabled={courante === 0}
                className="rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-medium text-text disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => aller(courante + 1)}
                className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                {courante === questions.length - 1 ? "Récapitulatif" : "Suivant"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-text">Récapitulatif</h2>
            <p className="mt-2 text-sm text-text-muted">
              {nombreRepondus} question{nombreRepondus > 1 ? "s" : ""} répondue{nombreRepondus > 1 ? "s" : ""} sur {questions.length}.
              Une fois soumise, l&apos;évaluation est définitive et ne peut plus être modifiée.
            </p>
            {nombreObservations > 0 && (
              <p className="mt-2 text-sm text-text-muted">
                {nombreObservations} élément{nombreObservations > 1 ? "s" : ""} à « Observations » : non pris en compte dans le calcul.
              </p>
            )}
            {sansReponse.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-warning">
                  {sansReponse.length} question{sansReponse.length > 1 ? "s" : ""} sans réponse (comptée{sansReponse.length > 1 ? "s" : ""} comme absente
                  {sansReponse.length > 1 ? "s" : ""} si ce sont des documents à examiner) :
                </p>
                <ul className="mt-2 flex max-h-56 flex-col gap-1 overflow-auto text-sm">
                  {sansReponse.map((q) => (
                    <li key={q.elementId}>
                      <button type="button" onClick={() => aller(q.index)} className="text-left text-primary hover:underline">
                        {q.critereCode} — {q.libelle}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {erreur && <p className="mt-4 text-sm text-danger">{erreur}</p>}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => aller(questions.length - 1)}
                className="rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-medium text-text"
              >
                Revenir aux questions
              </button>
              <button
                type="button"
                onClick={soumettre}
                disabled={pendingSoumission}
                className="rounded-[var(--radius-md)] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {pendingSoumission ? "Soumission…" : "Soumettre l'évaluation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
