import { IsEnum, IsOptional, IsString } from "class-validator";
import { GraviteEi, StatutEi } from "../../generated/prisma/enums.js";

export class ListEiQueryDto {
  @IsOptional()
  @IsEnum(StatutEi)
  statut?: StatutEi;

  @IsOptional()
  @IsEnum(GraviteEi)
  gravite?: GraviteEi;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  typeEiId?: string;
}
