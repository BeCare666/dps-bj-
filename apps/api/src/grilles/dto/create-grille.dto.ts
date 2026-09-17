import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { TypeEtablissement, TypeReponse } from "../../generated/prisma/enums.js";

export class CreateElementMesurableDto {
  @IsString()
  @MinLength(2)
  libelle!: string;

  @IsOptional()
  @IsEnum(TypeReponse)
  typeReponse?: TypeReponse;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionsChoix?: string[];

  @IsInt()
  ordre!: number;
}

export class CreateCritereDto {
  @IsString()
  code!: string;

  @IsString()
  @MinLength(2)
  libelle!: string;

  @IsInt()
  ordre!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateElementMesurableDto)
  elementsMesurables!: CreateElementMesurableDto[];
}

export class CreateNormeDto {
  @IsString()
  code!: string;

  @IsString()
  @MinLength(2)
  libelle!: string;

  @IsInt()
  ordre!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCritereDto)
  criteres!: CreateCritereDto[];
}

export class CreateDomaineDto {
  @IsString()
  @MinLength(2)
  nom!: string;

  @IsInt()
  ordre!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateNormeDto)
  normes!: CreateNormeDto[];
}

export class CreateGrilleDto {
  @IsString()
  @MinLength(2)
  nom!: string;

  @IsEnum(TypeEtablissement)
  type!: TypeEtablissement;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDomaineDto)
  domaines!: CreateDomaineDto[];
}
