import { IsEnum, IsOptional } from "class-validator";
import { TypeEtablissement } from "../../generated/prisma/enums.js";

export class ListFormationsQueryDto {
  @IsOptional()
  @IsEnum(TypeEtablissement)
  type?: TypeEtablissement;

  @IsOptional()
  inclureInactives?: string;
}
