import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { NiveauCritere, TypeEtablissement } from "../../generated/prisma/enums.js";

// Tous les champs du catalogue officiel (ROADMAP_FORMATIONS_VERIFICATION.md §3.2).
// Tarifs : prix par personne par tranche ; absents → valeurs par défaut (@dps/shared).
export class CreateFormationDto {
  @IsString()
  @MinLength(3)
  titre!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  // §9 — objectifs de la formation.
  @IsOptional()
  @IsString()
  objectifs?: string;

  @IsOptional()
  @IsEnum(TypeEtablissement)
  typeEtablissement?: TypeEtablissement;

  @IsOptional()
  @IsString()
  critere?: string;

  @IsOptional()
  @IsEnum(NiveauCritere)
  niveau?: NiveauCritere;

  @IsOptional()
  @IsString()
  domaineCode?: string;

  @IsOptional()
  @IsString()
  domaine?: string;

  @IsOptional()
  @IsString()
  publicCible?: string;

  @IsOptional()
  @IsString()
  exigenceArs?: string;

  @IsOptional()
  @IsString()
  contenus?: string;

  @IsOptional()
  @IsString()
  methode?: string;

  @IsOptional()
  @IsString()
  evaluation?: string;

  @IsOptional()
  @IsString()
  dureeLibelle?: string;

  // Heures décimales (« 30 min » = 0,5).
  @IsOptional()
  @IsNumber()
  @Min(0)
  dureeHeures?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordre?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  prixPersonne1a5?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  prixPersonne6a10?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  prixPersonne11Plus?: number;
}
