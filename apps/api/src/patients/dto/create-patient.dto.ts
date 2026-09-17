import { IsDateString, IsOptional, IsString, MinLength } from "class-validator";

export class CreatePatientDto {
  @IsString()
  @MinLength(2)
  nom!: string;

  @IsString()
  @MinLength(2)
  prenom!: string;

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsOptional()
  @IsString()
  sexe?: string;

  @IsOptional()
  @IsString()
  numeroDossier?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;
}
