import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { TypeEtablissement } from "../../generated/prisma/enums.js";

export class RegisterOrganisationDto {
  @IsString()
  @MinLength(2)
  organisationNom!: string;

  @IsString()
  @MinLength(3)
  organisationIfu!: string;

  @IsEnum(TypeEtablissement)
  organisationType!: TypeEtablissement;

  @IsOptional()
  @IsString()
  organisationAdresse?: string;

  @IsOptional()
  @IsString()
  organisationTelephone?: string;

  @IsOptional()
  @IsEmail()
  organisationEmail?: string;

  @IsString()
  @MinLength(2)
  responsableNom!: string;

  @IsString()
  @MinLength(2)
  responsablePrenom!: string;

  @IsEmail()
  responsableEmail!: string;

  @IsOptional()
  @IsString()
  responsableTelephone?: string;

  @IsString()
  @MinLength(8)
  motDePasse!: string;
}
