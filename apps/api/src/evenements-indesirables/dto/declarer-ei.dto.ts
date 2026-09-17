import { IsOptional, IsString, MinLength } from "class-validator";

export class DeclarerEiDto {
  @IsString()
  @MinLength(5)
  description!: string;

  @IsOptional()
  @IsString()
  typeEiId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  // RM10 — lien optionnel vers un critère d'auto-évaluation, sans effet sur le score.
  @IsOptional()
  @IsString()
  critereId?: string;
}
