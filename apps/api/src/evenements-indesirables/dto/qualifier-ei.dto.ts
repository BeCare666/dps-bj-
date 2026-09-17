import { IsEnum } from "class-validator";
import { GraviteEi } from "../../generated/prisma/enums.js";

export class QualifierEiDto {
  @IsEnum(GraviteEi)
  gravite!: GraviteEi;
}
