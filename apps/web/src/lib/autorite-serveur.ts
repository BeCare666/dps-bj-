import "server-only";
import { apiFetchJson, silencieux } from "./api-server";
import { lireFiltres, requeteApi, type FiltresAutorite, type ParametresUrl, type RaccourciPeriode } from "./autorite-filtres";
import type { AutoriteSanitaire, DonneesAutorite, EtablissementAutorite } from "./types";

// Lectures communes des pages de l'espace des autorités (ROADMAP_ESPACE_AUTORITES.md).

export async function contexteAutorite(searchParams: Promise<ParametresUrl>, raccourciParDefaut: RaccourciPeriode = "12m") {
  const params = await searchParams;
  const [autorite, etablissements] = await Promise.all([
    apiFetchJson<AutoriteSanitaire>("/autorite/me"),
    silencieux(apiFetchJson<EtablissementAutorite[]>("/autorite/etablissements"), []),
  ]);
  const filtres = lireFiltres(params, raccourciParDefaut);
  const noms = Object.fromEntries(etablissements.map((e) => [e.id, e.nom]));
  return { params, autorite, etablissements, filtres, noms };
}

// Valeurs d'indicateurs, par lots de 200 clés : l'URL reste sous la limite
// d'en-tête HTTP de Node (16 Ko) ; l'API en accepte 600 au maximum.
export async function donnees(formulaire: string, cles: string[], filtres: FiltresAutorite): Promise<DonneesAutorite> {
  const lots: string[][] = [];
  for (let i = 0; i < cles.length; i += 200) lots.push(cles.slice(i, i + 200));
  const reponses = await Promise.all(
    lots.map((lot) => apiFetchJson<DonneesAutorite>(`/autorite/donnees?${requeteApi(filtres, { formulaire, cles: lot.join(",") })}`)),
  );
  const [premiere, ...autres] = reponses;
  for (const r of autres) {
    for (const rapport of r.rapports) {
      const cible = premiere.rapports.find((x) => x.id === rapport.id);
      if (cible) Object.assign(cible.valeurs, rapport.valeurs);
    }
  }
  return premiere;
}

export function optionsEtablissements(etablissements: EtablissementAutorite[]) {
  return etablissements.map((e) => ({ id: e.id, nom: e.nom, commune: e.commune, typeStructure: e.typeStructure }));
}
