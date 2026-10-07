import { IsEmail, IsEnum, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { DEPARTEMENTS } from "@dps/shared";
import { Civilite, TypeEtablissement, TypeStructure } from "../../generated/prisma/enums.js";

// §4.1 — informations enregistrées lors de l'inscription du compte Organisation.
export class RegisterOrganisationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  organisationNom!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(191)
  organisationRaisonSociale!: string;

  @IsEnum(TypeStructure)
  organisationTypeStructure!: TypeStructure;

  // §4.1 / §13.2 — IFU : identifiant fiscal officiel de 13 chiffres.
  @Matches(/^\d{13}$/, { message: "L'IFU doit comporter exactement 13 chiffres" })
  organisationIfu!: string;

  // Catégorie ARS (EH / ESPC).
  @IsEnum(TypeEtablissement)
  organisationType!: TypeEtablissement;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  organisationAdresse?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(191)
  organisationVille!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(191)
  organisationPays!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  organisationTelephone!: string;

  @IsEmail()
  @MaxLength(191)
  organisationEmail!: string;

  // Rapports statistiques — localisation sanitaire, pré-remplie dans l'en-tête
  // des rapports transmis aux autorités (ROADMAP_RAPPORTS_STATISTIQUES.md).
  @IsIn(Object.keys(DEPARTEMENTS), { message: "Département inconnu" })
  organisationDepartement!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(191)
  organisationCommune!: string;

  @IsOptional()
  @IsString()
  @MaxLength(191)
  organisationArrondissement?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(191)
  organisationZoneSanitaire!: string;

  @IsEnum(Civilite)
  responsableCivilite!: Civilite;

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
