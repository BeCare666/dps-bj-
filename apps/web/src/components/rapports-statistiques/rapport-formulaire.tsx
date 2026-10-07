"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DEPARTEMENTS,
  cleCase,
  cleChamp,
  clePrecision,
  formulaireStatistique,
  natureCase,
  saisiesFormulaire,
  saisiesManquantes,
  valeurCase,
  type BlocChamps,
  type BlocOuiNon,
  type BlocTableau,
  type CleEntete,
  type Colonne,
  type ValeursRapport,
} from "@dps/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { enregistrerRapportAction, soumettreRapportAction } from "@/lib/rapports-statistiques-actions";
import {
  LIBELLES_ENTETE,
  LIBELLES_STATUT_RAPPORT,
  VARIANTES_STATUT_RAPPORT,
  libelleDepartement,
  libellePeriodeRapport,
} from "@/lib/rapports-statistiques-libelles";
import { formaterDateHeure } from "@/lib/format";
import type { RapportStatistique } from "@/lib/types";

// Rendu fidèle d'un formulaire papier (ROADMAP_RAPPORTS_STATISTIQUES.md) à
// partir de sa définition (@dps/shared) : mêmes lignes, mêmes colonnes, cases
// hachurées grisées, totaux calculés. Modifiable tant que le rapport est un
// brouillon du responsable du compte ; en lecture seule sinon.

const HACHURE =
  "bg-[repeating-linear-gradient(45deg,var(--color-border)_0,var(--color-border)_1px,transparent_1px,transparent_6px)]";
const CASE = "border border-border px-1 py-0.5 text-center tabular-nums";

// ---------------------------------------------------------------------------
// En-têtes de colonnes sur plusieurs niveaux
// ---------------------------------------------------------------------------

interface CaseEntete {
  cle: string;
  libelle: string;
  colSpan: number;
  rowSpan: number;
}

function memePrefixe(a: string[], b: string[], niveau: number): boolean {
  for (let i = 0; i <= niveau; i++) if (a[i] !== b[i]) return false;
  return (a.length === niveau + 1) === (b.length === niveau + 1);
}

function rangsEntete(colonnes: Colonne[]): { profondeur: number; rangs: CaseEntete[][] } {
  const profondeur = Math.max(...colonnes.map((c) => c.entetes.length));
  const rangs: CaseEntete[][] = [];
  for (let niveau = 0; niveau < profondeur; niveau++) {
    const rang: CaseEntete[] = [];
    let j = 0;
    while (j < colonnes.length) {
      const c = colonnes[j];
      if (c.entetes.length <= niveau) {
        j++;
        continue;
      }
      let k = j + 1;
      while (k < colonnes.length && colonnes[k].entetes.length > niveau && memePrefixe(colonnes[k].entetes, c.entetes, niveau)) k++;
      rang.push({
        cle: `${niveau}-${j}`,
        libelle: c.entetes[niveau],
        colSpan: k - j,
        rowSpan: niveau === c.entetes.length - 1 ? profondeur - niveau : 1,
      });
      j = k;
    }
    rangs.push(rang);
  }
  return { profondeur, rangs };
}

// ---------------------------------------------------------------------------
// Saisie d'un nombre (texte local pour permettre « 12, » pendant la frappe)
// ---------------------------------------------------------------------------

function lireNombre(texte: string): number | undefined {
  if (texte === "" || texte === ".") return undefined;
  return Number(texte);
}

function CelluleNombre({
  valeur,
  decimal,
  libelle,
  onChange,
  className = "",
}: {
  valeur: number | undefined;
  decimal?: boolean;
  libelle: string;
  onChange: (v: number | undefined) => void;
  className?: string;
}) {
  const [texte, setTexte] = useState(valeur === undefined ? "" : String(valeur));
  const [precedente, setPrecedente] = useState(valeur);
  if (valeur !== precedente) {
    setPrecedente(valeur);
    if (lireNombre(texte) !== valeur) setTexte(valeur === undefined ? "" : String(valeur));
  }

  return (
    <input
      aria-label={libelle}
      inputMode={decimal ? "decimal" : "numeric"}
      value={texte}
      onChange={(e) => {
        const t = e.target.value.replace(",", ".");
        if (!(decimal ? /^\d{0,9}(\.\d{0,2})?$/ : /^\d{0,9}$/).test(t)) return;
        setTexte(t);
        onChange(lireNombre(t));
      }}
      className={`w-full min-w-[2.75rem] bg-transparent px-1 py-1 text-center text-xs tabular-nums text-text focus:bg-primary-soft focus:outline-none ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Blocs
// ---------------------------------------------------------------------------

interface PropsBloc {
  valeurs: ValeursRapport;
  modifiable: boolean;
  modifier: (cle: string, v: number | string | boolean | undefined) => void;
}

function Tableau({ bloc, valeurs, modifiable, modifier }: PropsBloc & { bloc: BlocTableau }) {
  const { profondeur, rangs } = useMemo(() => rangsEntete(bloc.colonnes), [bloc]);
  const avecSousLibelle = bloc.lignes.some((l) => l.sousLibelle);
  const nbColonnesLibelle = 1 + (bloc.avecRef ? 1 : 0) + (avecSousLibelle ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-bg-subtle text-text-muted">
          {rangs.map((rang, i) => (
            <tr key={i}>
              {i === 0 && (
                <>
                  {bloc.avecRef && (
                    <th rowSpan={profondeur} className={`${CASE} font-semibold`}>
                      Réf
                    </th>
                  )}
                  <th
                    rowSpan={profondeur}
                    colSpan={avecSousLibelle ? 2 : 1}
                    className={`${CASE} sticky left-0 z-10 bg-bg-subtle text-left font-semibold`}
                  >
                    {bloc.enteteLibelle}
                  </th>
                </>
              )}
              {rang.map((c) => (
                <th key={c.cle} colSpan={c.colSpan} rowSpan={c.rowSpan} className={`${CASE} font-semibold`}>
                  {c.libelle}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {bloc.lignes.map((l, idx) => {
            if (l.section) {
              return (
                <tr key={l.id}>
                  <td
                    colSpan={nbColonnesLibelle + bloc.colonnes.length}
                    className="border border-border bg-bg-subtle px-2 py-1.5 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-text"
                  >
                    {l.libelle}
                  </td>
                </tr>
              );
            }

            // Libellé commun à plusieurs lignes consécutives (« Cas » / « Décès »).
            const precedente = bloc.lignes[idx - 1];
            const suiteDeGroupe = Boolean(precedente && !precedente.section && precedente.libelle === l.libelle);
            let rowSpan = 1;
            if (!suiteDeGroupe) {
              for (let k = idx + 1; k < bloc.lignes.length && !bloc.lignes[k].section && bloc.lignes[k].libelle === l.libelle; k++) rowSpan++;
            }
            const estTotal = Boolean(l.somme);

            return (
              <tr key={l.id} className={estTotal ? "font-semibold" : ""}>
                {!suiteDeGroupe && bloc.avecRef && (
                  <td rowSpan={rowSpan} className={`${CASE} text-text-muted`}>
                    {l.ref}
                  </td>
                )}
                {!suiteDeGroupe && (
                  <td rowSpan={rowSpan} className="sticky left-0 z-10 min-w-[14rem] max-w-[22rem] border border-border bg-surface px-2 py-1 text-left text-text">
                    <span>{l.libelle}</span>
                    {l.precision &&
                      (modifiable ? (
                        <input
                          aria-label={`${l.libelle} (précision)`}
                          value={String(valeurs[clePrecision(bloc.id, l.id)] ?? "")}
                          onChange={(e) => modifier(clePrecision(bloc.id, l.id), e.target.value || undefined)}
                          maxLength={191}
                          className="ml-1 w-40 border-b border-dashed border-border bg-transparent px-1 focus:border-primary focus:outline-none"
                        />
                      ) : (
                        <span className="ml-1">{String(valeurs[clePrecision(bloc.id, l.id)] ?? "")}</span>
                      ))}
                  </td>
                )}
                {avecSousLibelle && <td className={`${CASE} whitespace-nowrap text-text-muted`}>{l.sousLibelle}</td>}
                {bloc.colonnes.map((c) => {
                  const nature = natureCase(bloc, l, c);
                  if (nature === "fusionnee") return null;
                  const fusion = l.fusions?.find((f) => f.colonnes[0] === c.id);
                  const colSpan = fusion ? fusion.colonnes.length : undefined;

                  if (nature === "hachuree") {
                    return <td key={c.id} colSpan={colSpan} className={`border border-border ${HACHURE}`} aria-hidden="true" />;
                  }
                  const v = valeurCase(bloc, l, c, valeurs);
                  if (nature === "calculee") {
                    return (
                      <td key={c.id} colSpan={colSpan} className={`${CASE} bg-bg-subtle font-semibold text-text`}>
                        {v ?? ""}
                      </td>
                    );
                  }
                  const cle = cleCase(bloc.id, l.id, c.id);
                  return (
                    <td key={c.id} colSpan={colSpan} className={`${CASE} ${v === undefined && modifiable ? "bg-warning-soft/40" : ""}`}>
                      {modifiable ? (
                        <CelluleNombre
                          valeur={v ?? undefined}
                          decimal={c.decimal}
                          libelle={`${l.ref ? `${l.ref} ` : ""}${l.libelle}${l.sousLibelle ? ` (${l.sousLibelle})` : ""} — ${c.entetes.join(" ")}`}
                          onChange={(n) => modifier(cle, n)}
                        />
                      ) : (
                        <span className="px-1">{v ?? ""}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OuiNon({ bloc, valeurs, modifiable, modifier }: PropsBloc & { bloc: BlocOuiNon }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th colSpan={bloc.elements.length} className={`${CASE} bg-bg-subtle font-semibold text-text`}>
              {bloc.titre}
            </th>
          </tr>
          <tr>
            {bloc.elements.map((e) => (
              <th key={e.id} className={`${CASE} font-semibold text-text-muted`}>
                {e.libelle}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {bloc.elements.map((e) => {
              const cle = cleChamp(bloc.id, e.id);
              const v = valeurs[cle];
              return (
                <td key={e.id} className={`${CASE} py-2 ${v === undefined && modifiable ? "bg-warning-soft/40" : ""}`}>
                  {modifiable ? (
                    <div className="flex justify-center gap-3">
                      {([true, false] as const).map((choix) => (
                        <label key={String(choix)} className="flex items-center gap-1">
                          <input type="radio" name={cle} checked={v === choix} onChange={() => modifier(cle, choix)} />
                          {choix ? "Oui" : "Non"}
                        </label>
                      ))}
                    </div>
                  ) : v === undefined ? (
                    ""
                  ) : v ? (
                    "Oui"
                  ) : (
                    "Non"
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Champs({ bloc, valeurs, modifiable, modifier }: PropsBloc & { bloc: BlocChamps }) {
  return (
    <div className="grid gap-4 rounded-[var(--radius-md)] border border-border bg-surface p-4 sm:grid-cols-3">
      {bloc.champs.map((ch) => {
        const cle = cleChamp(bloc.id, ch.id);
        const v = valeurs[cle];
        const large = ch.nature === "texte_long" ? "sm:col-span-3" : "";
        return (
          <div key={ch.id} className={`flex flex-col gap-1.5 ${large}`}>
            <span className="text-xs font-medium text-text">{ch.libelle}</span>
            {!modifiable ? (
              <p className="min-h-[1.5rem] whitespace-pre-wrap text-sm text-text">{v === undefined ? "—" : String(v)}</p>
            ) : ch.nature === "nombre" ? (
              <div className={`rounded-[var(--radius-md)] border border-border ${v === undefined ? "bg-warning-soft/40" : ""}`}>
                <CelluleNombre
                  valeur={typeof v === "number" ? v : undefined}
                  libelle={ch.libelle}
                  onChange={(n) => modifier(cle, n)}
                  className="py-2 text-sm"
                />
              </div>
            ) : ch.nature === "texte_long" ? (
              <textarea
                value={String(v ?? "")}
                maxLength={2000}
                rows={3}
                onChange={(e) => modifier(cle, e.target.value || undefined)}
                className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              />
            ) : (
              <input
                value={String(v ?? "")}
                maxLength={191}
                onChange={(e) => modifier(cle, e.target.value || undefined)}
                className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulaire complet
// ---------------------------------------------------------------------------

function nomPersonne(u: { nom: string; prenom: string } | null): string {
  return u ? `${u.prenom} ${u.nom}` : "";
}

export function RapportFormulaire({ rapport, modifiable }: { rapport: RapportStatistique; modifiable: boolean }) {
  const def = formulaireStatistique(rapport.formulaireCode);
  const router = useRouter();
  const [entete, setEntete] = useState<Record<string, string>>(rapport.entete);
  const [valeurs, setValeurs] = useState<ValeursRapport>(rapport.valeurs);
  const enregistre = useRef<{ entete: Record<string, string>; valeurs: ValeursRapport }>({
    entete: rapport.entete,
    valeurs: rapport.valeurs,
  });
  const [message, setMessage] = useState<{ erreur: boolean; texte: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState(false);

  const manquantes = useMemo(() => (def ? saisiesManquantes(def, valeurs).length : 0), [def, valeurs]);
  const videsNumeriques = useMemo(
    () =>
      def
        ? saisiesFormulaire(def).filter((s) => (s.nature === "entier" || s.nature === "decimal") && valeurs[s.cle] === undefined)
        : [],
    [def, valeurs],
  );

  if (!def) return <p className="text-sm text-danger">Formulaire inconnu : {rapport.formulaireCode}</p>;

  const departementLibelle = libelleDepartement(entete.departement);

  function modifier(cle: string, v: number | string | boolean | undefined) {
    setMessage(null);
    setValeurs((prec) => {
      const suivant = { ...prec };
      if (v === undefined) delete suivant[cle];
      else suivant[cle] = v;
      return suivant;
    });
  }

  function modifications() {
    const base = enregistre.current;
    const v: Record<string, unknown> = {};
    for (const [cle, val] of Object.entries(valeurs)) if (base.valeurs[cle] !== val) v[cle] = val;
    for (const cle of Object.keys(base.valeurs)) if (!(cle in valeurs)) v[cle] = null;
    const e: Record<string, string> = {};
    for (const [cle, val] of Object.entries(entete)) if (base.entete[cle] !== val) e[cle] = val;
    return { entete: e, valeurs: v };
  }

  async function enregistrer(): Promise<boolean> {
    const resultat = await enregistrerRapportAction(rapport.id, modifications());
    if (resultat.erreur) {
      setMessage({ erreur: true, texte: resultat.erreur });
      return false;
    }
    enregistre.current = { entete, valeurs };
    return true;
  }

  function surEnregistrer() {
    startTransition(async () => {
      if (await enregistrer()) setMessage({ erreur: false, texte: "Brouillon enregistré." });
    });
  }

  async function surSoumettre() {
    if (!(await enregistrer())) return;
    const resultat = await soumettreRapportAction(rapport.id);
    if (resultat.erreur) {
      setMessage({ erreur: true, texte: resultat.erreur });
      return;
    }
    router.refresh();
  }

  function remplirZeros() {
    setValeurs((prec) => {
      const suivant = { ...prec };
      for (const s of videsNumeriques) suivant[s.cle] = 0;
      return suivant;
    });
  }

  const propsBloc = { valeurs, modifiable, modifier };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* En-tête officiel */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-xs uppercase tracking-wide text-text-muted">
            {def.emetteur.map((ligne) => (
              <p key={ligne}>{ligne.replaceAll("{departement}", departementLibelle)}</p>
            ))}
          </div>
          <div className="flex flex-col items-start gap-1 text-xs text-text-muted sm:items-end">
            <Badge variant={VARIANTES_STATUT_RAPPORT[rapport.statut]}>{LIBELLES_STATUT_RAPPORT[rapport.statut]}</Badge>
            <span>Formulaire {def.version}</span>
          </div>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-text">{def.titre}</h2>
        <p className="text-sm text-text-muted">
          {def.periodicite === "MENSUELLE" ? "Mois de " : ""}
          {libellePeriodeRapport(rapport.formulaireCode, rapport.periode)}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {def.entete.map((cle: CleEntete) => (
            <div key={cle} className="flex flex-col gap-1.5">
              <label htmlFor={`entete-${cle}`} className="text-xs font-medium text-text">
                {LIBELLES_ENTETE[cle]}
              </label>
              {!modifiable ? (
                <p className="text-sm text-text">{(cle === "departement" ? departementLibelle : entete[cle]) || "—"}</p>
              ) : cle === "departement" ? (
                <select
                  id={`entete-${cle}`}
                  value={entete[cle] ?? ""}
                  onChange={(e) => setEntete({ ...entete, [cle]: e.target.value })}
                  className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text"
                >
                  <option value="">Sélectionner…</option>
                  {Object.entries(DEPARTEMENTS).map(([code, libelle]) => (
                    <option key={code} value={code}>
                      {libelle}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`entete-${cle}`}
                  value={entete[cle] ?? ""}
                  maxLength={191}
                  onChange={(e) => setEntete({ ...entete, [cle]: e.target.value })}
                  className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text"
                />
              )}
            </div>
          ))}
        </div>

        <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-xs text-text-muted sm:grid-cols-3">
          <div>
            <dt className="font-medium text-text">Transmis le</dt>
            <dd>{rapport.soumisLe ? `${formaterDateHeure(rapport.soumisLe)} par ${nomPersonne(rapport.soumisPar)}` : "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-text">Reçu par la zone sanitaire le</dt>
            <dd>{rapport.recuLe ? formaterDateHeure(rapport.recuLe) : "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-text">Validé le</dt>
            <dd>{rapport.valideLe ? `${formaterDateHeure(rapport.valideLe)} par ${nomPersonne(rapport.validePar)}` : "—"}</dd>
          </div>
        </dl>
      </section>

      {def.blocs.map((bloc) => (
        <section key={bloc.id} className="flex flex-col gap-2">
          {"titre" in bloc && bloc.titre && bloc.type !== "oui_non" && <h3 className="text-sm font-semibold text-text">{bloc.titre}</h3>}
          {bloc.type === "tableau" && <Tableau bloc={bloc} {...propsBloc} />}
          {bloc.type === "oui_non" && <OuiNon bloc={bloc} {...propsBloc} />}
          {bloc.type === "champs" && <Champs bloc={bloc} {...propsBloc} />}
        </section>
      ))}

      {def.notes.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-text-muted">
          {def.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      {modifiable && (
        <div className="sticky bottom-0 z-20 -mx-1 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface/95 p-4 shadow-[var(--shadow-soft)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {message ? (
              <span className={message.erreur ? "text-danger" : "text-success"}>{message.texte}</span>
            ) : manquantes > 0 ? (
              <span className="text-text-muted">{manquantes} case(s) encore vide(s) — toutes les cases doivent être remplies pour soumettre.</span>
            ) : (
              <span className="text-success">Toutes les cases sont remplies.</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {videsNumeriques.length > 0 && (
              <Button type="button" variant="ghost" onClick={remplirZeros} disabled={pending}>
                Mettre 0 dans les {videsNumeriques.length} case(s) vide(s)
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={surEnregistrer} disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer le brouillon"}
            </Button>
            <Button type="button" onClick={() => setConfirmation(true)} disabled={pending || manquantes > 0}>
              Soumettre
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmation}
        onClose={() => setConfirmation(false)}
        onConfirm={surSoumettre}
        titre="Soumettre le rapport ?"
        description="Le rapport sera transmis aux autorités sanitaires de votre ressort. Il ne pourra plus être modifié."
        confirmLabel="Soumettre"
        danger={false}
      />
    </div>
  );
}
