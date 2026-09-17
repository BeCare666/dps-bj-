import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Headers } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { KkiapayService } from "../paiements/kkiapay.service.js";
import { ReservationsService } from "./reservations.service.js";
import { StatutReservation } from "../generated/prisma/enums.js";
import { Public } from "../auth/decorators/public.decorator.js";

interface PayloadWebhookKkiapay {
  transactionId: string;
  isPaymentSucces: boolean;
  amount: number;
  event: "transaction.success" | "transaction.failed";
}

// 11.3 — webhook KKiaPay. ⚠️ Non testé contre un vrai envoi KKiaPay (nécessite
// une transaction réelle initiée par le widget, pas encore construit — voir
// KkiapayService). La vérification de signature suppose que le "hash secret"
// du dashboard KKiaPay correspond à KKIAPAY_SECRET — à confirmer à la mise en
// place réelle du webhook (section 13, configuration de l'URL de callback).
@Controller("paiements/kkiapay")
export class PaiementsWebhookController {
  private readonly logger = new Logger(PaiementsWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kkiapay: KkiapayService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("webhook")
  async webhook(@Body() payload: PayloadWebhookKkiapay, @Headers("x-kkiapay-secret") signature?: string) {
    if (!signature || signature !== process.env.KKIAPAY_SECRET) {
      this.logger.warn("Webhook KKiaPay reçu avec une signature invalide — ignoré");
      return { received: true };
    }

    if (payload.event !== "transaction.success" || !payload.isPaymentSucces) {
      return { received: true };
    }

    const reservation = await this.prisma.reservation.findFirst({
      where: { kkiapayTransactionId: payload.transactionId },
    });
    if (reservation && reservation.statut === StatutReservation.ATTENTE_PAIEMENT) {
      // Cas où le webhook confirme une transaction déjà rattachée à une
      // réservation (ex. après un premier essai de vérification échoué).
      try {
        const transaction = await this.kkiapay.verifierTransaction(payload.transactionId);
        if (transaction.status === "SUCCESS" && Number(transaction.amount) === reservation.tarifApplique) {
          await this.reservationsService.confirmerPaiement(reservation, payload.transactionId);
        }
      } catch (erreur) {
        this.logger.error(`Échec de vérification KKiaPay depuis le webhook : ${erreur}`);
      }
    } else if (!reservation) {
      // Pas encore de réservation associée à ce transactionId : le flux
      // principal est la vérification déclenchée par le client
      // (`POST /reservations/:id/paiement/verifier`), qui associera l'ID.
      this.logger.warn(
        `Webhook KKiaPay pour une transaction sans réservation associée (${payload.transactionId}) — ignoré pour l'instant`,
      );
    }

    return { received: true };
  }
}
