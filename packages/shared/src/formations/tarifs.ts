// Tarifs des formations : prix par personne selon la taille du groupe
// (demande client du 27/11/2026). Une personne de 1 à 5 : 5 000 FCFA ;
// de 6 à 10 : 3 000 FCFA ; plus de 10 : 2 000 FCFA. Ce sont les valeurs par
// défaut de chaque formation, modifiables formation par formation dans l'admin.

export interface TarifsFormation {
  prixPersonne1a5: number;
  prixPersonne6a10: number;
  prixPersonne11Plus: number;
}

export const TARIFS_FORMATION_DEFAUT: TarifsFormation = {
  prixPersonne1a5: 5000,
  prixPersonne6a10: 3000,
  prixPersonne11Plus: 2000,
};

// Plafond de saisie d'une réservation (contrôle de cohérence du formulaire).
export const PLACES_RESERVATION_MAX = 500;

export const TRANCHES_TARIF_FORMATION = [
  { cle: "prixPersonne1a5", libelle: "De 1 à 5 personnes", min: 1, max: 5 },
  { cle: "prixPersonne6a10", libelle: "De 6 à 10 personnes", min: 6, max: 10 },
  { cle: "prixPersonne11Plus", libelle: "Plus de 10 personnes", min: 11, max: null },
] as const satisfies readonly { cle: keyof TarifsFormation; libelle: string; min: number; max: number | null }[];

export function prixParPersonne(tarifs: TarifsFormation, nombrePlaces: number): number {
  if (nombrePlaces <= 5) return tarifs.prixPersonne1a5;
  if (nombrePlaces <= 10) return tarifs.prixPersonne6a10;
  return tarifs.prixPersonne11Plus;
}

export function montantReservation(tarifs: TarifsFormation, nombrePlaces: number): number {
  return prixParPersonne(tarifs, nombrePlaces) * nombrePlaces;
}
