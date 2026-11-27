import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { RoleUtilisateur } from "../generated/prisma/enums.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";
import { VerificationService } from "./verification.service.js";
import { CreerEvaluationExterneDto, LierEvaluationExterneDto, RechercheEtablissementQueryDto } from "./dto/verification.dto.js";

const TAILLE_MAX_DOCUMENT_OCTETS = 10 * 1024 * 1024;
const TYPES_DOCUMENT_AUTORISES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

@Controller("verification")
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  // §5.2 — « Vérifier votre établissement » : recherche publique par nom.
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get("etablissements")
  rechercher(@Query() query: RechercheEtablissementQueryDto) {
    return this.verification.rechercher(query.q);
  }

  // §11.1 — niveau de l'établissement connecté (bandeau de l'auto-évaluation).
  @Get("mon-etablissement")
  monEtablissement(@CurrentUser() user: JwtAccessPayload) {
    if (!user.organisationId) throw new ForbiddenException("Réservé aux comptes organisation");
    return this.verification.pourOrganisation(user.organisationId);
  }
}

// §5.3 — évaluations ARS / Ministère enregistrées par DSP.
@Roles(RoleUtilisateur.ADMIN_PLATEFORME)
@Controller("evaluations-externes")
export class EvaluationsExternesController {
  constructor(private readonly verification: VerificationService) {}

  @Get()
  lister() {
    return this.verification.listerExternes();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("document", {
      limits: { fileSize: TAILLE_MAX_DOCUMENT_OCTETS },
      fileFilter: (_req, file, callback) => {
        if (!TYPES_DOCUMENT_AUTORISES.has(file.mimetype)) {
          callback(new BadRequestException(`Type de document non autorisé : ${file.mimetype}`), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  creer(
    @Body() dto: CreerEvaluationExterneDto,
    @UploadedFile() document: Express.Multer.File,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    if (!document) throw new BadRequestException("Document justificatif obligatoire");
    return this.verification.creerExterne(dto, document, user.sub);
  }

  @Patch(":id/organisation")
  lier(@Param("id") id: string, @Body() dto: LierEvaluationExterneDto) {
    return this.verification.lierExterne(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  supprimer(@Param("id") id: string) {
    return this.verification.supprimerExterne(id);
  }
}
