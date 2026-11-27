import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { SourceEvaluationExterne, TypeEtablissement } from "../../generated/prisma/enums.js";

export class RechercheEtablissementQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q!: string;
}

// Champs envoyés en multipart avec le document justificatif : les nombres
// arrivent en texte et sont convertis.
export class CreerEvaluationExterneDto {
  @IsString()
  @MinLength(2)
  nomEtablissement!: string;

  @IsEnum(TypeEtablissement)
  typeEtablissement!: TypeEtablissement;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  ifu?: string;

  @IsEnum(SourceEvaluationExterne)
  source!: SourceEvaluationExterne;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  niveau!: number;

  @IsDateString()
  dateEvaluation!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  pctEssentiels?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  pctFondamentaux?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  pctAvances?: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  organisationId?: string;
}

export class LierEvaluationExterneDto {
  // null : rattachement retiré.
  @IsOptional()
  @IsString()
  organisationId?: string | null;
}
