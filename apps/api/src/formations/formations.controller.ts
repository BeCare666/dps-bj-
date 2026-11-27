import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FormationsService } from "./formations.service.js";
import { CreateFormationDto } from "./dto/create-formation.dto.js";
import { ListFormationsQueryDto } from "./dto/list-formations-query.dto.js";
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RoleUtilisateur } from "../generated/prisma/enums.js";

const TAILLE_MAX_IMAGE_OCTETS = 5 * 1024 * 1024;
const TYPES_IMAGE_AUTORISES = new Set(["image/jpeg", "image/png", "image/webp"]);

@Controller("formations")
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  // 10.1 — catalogue public (page d'accueil / présentation), pas d'auth requise.
  // `type` filtre le catalogue officiel par type d'établissement (EH / ESPC).
  @Public()
  @Get()
  lister(@Query() query: ListFormationsQueryDto) {
    return this.formationsService.lister(query.inclureInactives === "true", query.type);
  }

  @Public()
  @Get(":id")
  obtenir(@Param("id") id: string) {
    return this.formationsService.obtenir(id);
  }

  @Roles(RoleUtilisateur.ADMIN_PLATEFORME)
  @Post()
  creer(@Body() dto: CreateFormationDto) {
    return this.formationsService.creer(dto);
  }

  @Roles(RoleUtilisateur.ADMIN_PLATEFORME)
  @Patch(":id")
  mettreAJour(@Param("id") id: string, @Body() dto: CreateFormationDto) {
    return this.formationsService.mettreAJour(id, dto);
  }

  @Roles(RoleUtilisateur.ADMIN_PLATEFORME)
  @Post(":id/image")
  @UseInterceptors(
    FileInterceptor("fichier", {
      limits: { fileSize: TAILLE_MAX_IMAGE_OCTETS },
      fileFilter: (_req, file, callback) => {
        if (!TYPES_IMAGE_AUTORISES.has(file.mimetype)) {
          callback(new BadRequestException(`Type d'image non autorisé : ${file.mimetype}`), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  definirImage(@Param("id") id: string, @UploadedFile() fichier: Express.Multer.File) {
    if (!fichier) throw new BadRequestException("Image manquante");
    return this.formationsService.definirImage(id, fichier);
  }

  @Roles(RoleUtilisateur.ADMIN_PLATEFORME)
  @Delete(":id/image")
  retirerImage(@Param("id") id: string) {
    return this.formationsService.retirerImage(id);
  }

  @Roles(RoleUtilisateur.ADMIN_PLATEFORME)
  @Post(":id/desactiver")
  desactiver(@Param("id") id: string) {
    return this.formationsService.desactiver(id);
  }

  @Roles(RoleUtilisateur.ADMIN_PLATEFORME)
  @Post(":id/reactiver")
  reactiver(@Param("id") id: string) {
    return this.formationsService.reactiver(id);
  }
}
