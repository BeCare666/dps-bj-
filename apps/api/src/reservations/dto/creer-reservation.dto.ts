import { IsEnum, IsOptional, IsString } from "class-validator";
import { FormuleFormation } from "../../generated/prisma/enums.js";

export class CreerReservationDto {
  @IsString()
  formationId!: string;

  @IsEnum(FormuleFormation)
  formule!: FormuleFormation;

  // §4.2 — session en ligne planifiée choisie à la réservation ; à défaut, DSP
  // l'affecte après paiement.
  @IsOptional()
  @IsString()
  sessionFormationId?: string;
}
