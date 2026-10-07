import { IsEnum, IsIn, IsObject, IsOptional, IsString, Matches } from "class-validator";
import { FORMULAIRES_STATISTIQUES } from "@dps/shared";
import { StatutRapportStatistique } from "../../generated/prisma/enums.js";

const CODES = FORMULAIRES_STATISTIQUES.map((f) => f.code);

export class CreerRapportDto {
  @IsIn(CODES, { message: "Formulaire inconnu" })
  formulaireCode!: string;

  // AAAA-MM (mensuel) ou AAAA-Snn (hebdomadaire) ; la cohérence avec la
  // périodicité du formulaire est vérifiée par le service.
  @Matches(/^\d{4}-(\d{2}|S\d{2})$/, { message: "Période attendue au format AAAA-MM ou AAAA-Snn" })
  periode!: string;
}

export class EnregistrerRapportDto {
  // Champs d'en-tête modifiés (clés du formulaire uniquement, vérifiées par le service).
  @IsOptional()
  @IsObject()
  entete?: Record<string, unknown>;

  // Valeurs modifiées, par clé de case ; null efface la case.
  @IsOptional()
  @IsObject()
  valeurs?: Record<string, unknown>;
}

export class ListerRapportsQueryDto {
  @IsOptional()
  @IsIn(CODES)
  formulaire?: string;

  @IsOptional()
  @IsEnum(StatutRapportStatistique)
  statut?: StatutRapportStatistique;

  @IsOptional()
  @IsString()
  organisationId?: string;
}
