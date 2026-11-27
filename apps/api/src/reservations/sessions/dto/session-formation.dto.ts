import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { StatutSessionFormation } from "../../../generated/prisma/enums.js";

export class CreerSessionFormationDto {
  @IsString()
  formationId!: string;

  @IsDateString()
  debut!: string;

  @IsDateString()
  fin!: string;

  @IsUrl({ protocols: ["https"], require_protocol: true })
  lienMeet!: string;

  @IsOptional()
  @IsString()
  codeMeet?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  placesMax?: number;
}

export class ModifierSessionFormationDto {
  @IsOptional()
  @IsDateString()
  debut?: string;

  @IsOptional()
  @IsDateString()
  fin?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  lienMeet?: string;

  @IsOptional()
  @IsString()
  codeMeet?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  placesMax?: number | null;
}

export class ListSessionsFormationQueryDto {
  @IsOptional()
  @IsString()
  formationId?: string;

  @IsOptional()
  @IsEnum(StatutSessionFormation)
  statut?: StatutSessionFormation;
}

class PresenceDto {
  @IsString()
  participantId!: string;

  @IsBoolean()
  present!: boolean;
}

export class EnregistrerPresencesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PresenceDto)
  presences!: PresenceDto[];
}

export class AffecterSessionDto {
  @IsString()
  sessionFormationId!: string;
}

export class AjouterParticipantDto {
  @IsString()
  @MinLength(1)
  nom!: string;

  @IsString()
  @MinLength(1)
  prenom!: string;

  @IsString()
  @MinLength(2)
  fonction!: string;

  @IsOptional()
  @IsString()
  service?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  telephone?: string;
}
