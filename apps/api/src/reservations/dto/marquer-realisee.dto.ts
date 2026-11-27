import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";
import { PLACES_RESERVATION_MAX } from "@dps/shared";

// §12.5 — clôture d'une session et suivi des présences.
export class MarquerRealiseeDto {
  @IsOptional()
  @IsBoolean()
  presenceConfirmee?: boolean;

  // Nombre de participants présents (au plus le nombre de places réservées).
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(PLACES_RESERVATION_MAX)
  participantsPresents?: number;
}
