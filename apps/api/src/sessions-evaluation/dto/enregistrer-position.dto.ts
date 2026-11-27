import { IsInt, Min } from "class-validator";

export class EnregistrerPositionDto {
  // Rang de la question affichée (0-based) ; égal au nombre de questions
  // pour le récapitulatif.
  @IsInt()
  @Min(0)
  position!: number;
}
