// Socle commun et parcours par métier du catalogue EH (ROADMAP_FORMATIONS_VERIFICATION.md §1.3).
export interface EtapeSocleFormations {
  etape: string;
  libelle: string;
  criteres: string[];
}

export interface ParcoursMetier {
  nom: string;
  // Liste telle qu'écrite dans le document (avec ses précisions, ex. « volet encadrement »).
  formations: string;
  criteres: string[];
  volumeHeures: number;
}

export interface ParcoursFormationsEh {
  socle: { titre: string; etapes: EtapeSocleFormations[] };
  parcours: ParcoursMetier[];
}
