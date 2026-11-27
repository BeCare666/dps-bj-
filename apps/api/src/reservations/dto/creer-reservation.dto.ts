import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { PLACES_RESERVATION_MAX } from "@dps/shared";

export class CreerReservationDto {
  @IsString()
  formationId!: string;

  // Nombre de personnes à former (libre) : fixe le prix par personne.
  @IsInt()
  @Min(1)
  @Max(PLACES_RESERVATION_MAX)
  nombrePlaces!: number;

  // §4.2 — session en ligne planifiée choisie à la réservation ; à défaut, DSP
  // l'affecte après paiement.
  @IsOptional()
  @IsString()
  sessionFormationId?: string;
}
