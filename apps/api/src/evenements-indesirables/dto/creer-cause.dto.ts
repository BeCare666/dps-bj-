import { IsEnum, IsString, MinLength } from "class-validator";
import { TypeCause } from "../../generated/prisma/enums.js";

export class CreerCauseDto {
  @IsEnum(TypeCause)
  type!: TypeCause;

  @IsString()
  @MinLength(3)
  description!: string;
}
