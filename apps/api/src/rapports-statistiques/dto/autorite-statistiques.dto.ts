import { IsEnum, IsIn, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { FORMULAIRES_STATISTIQUES } from "@dps/shared";
import { StatutRapportStatistique } from "../../generated/prisma/enums.js";

const CODES = FORMULAIRES_STATISTIQUES.map((f) => f.code);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Filtres communs des tableaux de bord des autorités (ROADMAP_ESPACE_AUTORITES.md,
// étape 3). Listes passées en valeurs séparées par des virgules.
export class FiltresAutoriteDto {
  // Périodes dont le début tombe entre du et au (inclus), AAAA-MM-JJ.
  @IsOptional()
  @Matches(DATE, { message: "Date attendue au format AAAA-MM-JJ" })
  du?: string;

  @IsOptional()
  @Matches(DATE, { message: "Date attendue au format AAAA-MM-JJ" })
  au?: string;

  @IsOptional()
  @IsIn(CODES, { message: "Formulaire inconnu" })
  formulaire?: string;

  @IsOptional()
  @IsEnum(StatutRapportStatistique)
  statut?: StatutRapportStatistique;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  organisations?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  communes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  structures?: string;
}

export class TransmissionsQueryDto extends FiltresAutoriteDto {
  @IsIn(CODES, { message: "Formulaire inconnu" })
  declare formulaire: string;
}

export class DonneesQueryDto extends FiltresAutoriteDto {
  @IsIn(CODES, { message: "Formulaire inconnu" })
  declare formulaire: string;

  // Indicateurs demandés (clés de cases), séparés par des virgules.
  @IsString()
  @MaxLength(40000)
  cles!: string;
}
