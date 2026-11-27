import { IsDefined, IsOptional, IsString, MaxLength } from "class-validator";

export class EnregistrerReponseDto {
  // Type dépendant du `typeReponse` de l'élément mesurable ciblé : pour
  // OUI_NON (« Présent / Absent / Observations »), "PRESENT", "ABSENT" ou
  // "OBSERVATION" ; string pour TEXTE/CHOIX. Validé au niveau service.
  @IsDefined()
  valeur!: unknown;

  // Texte de l'observation, conservé uniquement avec la réponse « Observations ».
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  commentaire?: string;
}
