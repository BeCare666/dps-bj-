import { IsBoolean, IsOptional } from "class-validator";

export class MarquerRealiseeDto {
  @IsOptional()
  @IsBoolean()
  presenceConfirmee?: boolean;
}
