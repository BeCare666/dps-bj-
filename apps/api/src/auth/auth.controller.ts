import { Body, Controller, HttpCode, HttpStatus, Post, Query, Req, Res, Get } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService, type CompteEnregistre, type TokensEtUtilisateur } from "./auth.service.js";
import { RegisterOrganisationDto } from "./dto/register-organisation.dto.js";
import { RegisterIndividuelDto } from "./dto/register-individuel.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { ForgotPasswordDto } from "./dto/forgot-password.dto.js";
import { ResetPasswordDto } from "./dto/reset-password.dto.js";
import { ResendVerificationDto } from "./dto/resend-verification.dto.js";
import { Public } from "./decorators/public.decorator.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import type { JwtAccessPayload } from "./types/jwt-payload.type.js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, accessTokenCookieOptions, refreshTokenCookieOptions } from "./auth.util.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register/organisation")
  async registerOrganisation(@Body() dto: RegisterOrganisationDto) {
    const resultat = await this.authService.registerOrganisation(dto);
    return this.repondreCompteEnregistre(resultat);
  }

  @Public()
  @Post("register/individuel")
  async registerIndividuel(@Body() dto: RegisterIndividuelDto) {
    const resultat = await this.authService.registerIndividuel(dto);
    return this.repondreCompteEnregistre(resultat);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const resultat = await this.authService.login(dto);
    return this.repondreAvecTokens(res, resultat);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const resultat = await this.authService.refresh(rawRefreshToken);
    return this.repondreAvecTokens(res, resultat);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    await this.authService.logout(rawRefreshToken);
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/auth" });
    return { success: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { success: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.nouveauMotDePasse);
    return { success: true };
  }

  // Lien cliqué depuis l'email (hors SPA) : redirige vers la page de connexion
  // du frontend plutôt que de renvoyer du JSON.
  @Public()
  @Get("verify-email")
  async verifyEmail(@Query("token") token: string, @Res() res: Response) {
    const base = process.env.WEB_APP_URL ?? "http://localhost:3000";
    try {
      await this.authService.verifyEmail(token);
      return res.redirect(`${base}/login?verified=true`);
    } catch {
      return res.redirect(`${base}/login?verified=false`);
    }
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("resend-verification")
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerificationEmail(dto.email);
    return { success: true };
  }

  @Get("me")
  me(@CurrentUser() user: JwtAccessPayload) {
    return user;
  }

  private repondreAvecTokens(res: Response, resultat: TokensEtUtilisateur) {
    res.cookie(ACCESS_TOKEN_COOKIE, resultat.accessToken, accessTokenCookieOptions());
    res.cookie(REFRESH_TOKEN_COOKIE, resultat.refreshToken, refreshTokenCookieOptions());

    const { motDePasseHash: _motDePasseHash, ...utilisateurSansMdp } = resultat.utilisateur;
    return { utilisateur: utilisateurSansMdp };
  }

  private repondreCompteEnregistre(resultat: CompteEnregistre) {
    const { motDePasseHash: _motDePasseHash, ...utilisateurSansMdp } = resultat.utilisateur;
    return {
      utilisateur: utilisateurSansMdp,
      message: "Compte créé. Vérifiez votre boîte email pour confirmer votre adresse avant de vous connecter.",
    };
  }
}
