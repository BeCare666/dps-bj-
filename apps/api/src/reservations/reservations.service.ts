import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { KkiapayService } from "../paiements/kkiapay.service.js";
import { MailerService } from "../notifications/mailer.service.js";
import { FormuleFormation, RoleUtilisateur, StatutReservation, TypeCompte } from "../generated/prisma/enums.js";
import type { Reservation } from "../generated/prisma/client.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";
import type { CreerReservationDto } from "./dto/creer-reservation.dto.js";
import type { VerifierPaiementDto } from "./dto/verifier-paiement.dto.js";
import type { FixerDateRdvDto } from "./dto/fixer-date-rdv.dto.js";
import type { MarquerRealiseeDto } from "./dto/marquer-realisee.dto.js";
import type { ListReservationsQueryDto } from "./dto/list-reservations-query.dto.js";

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kkiapay: KkiapayService,
    private readonly mailer: MailerService,
  ) {}

  // 9.1/9.2/9.9 — Organisation et Individuel peuvent réserver, pas l'admin plateforme.
  async creer(dto: CreerReservationDto, user: JwtAccessPayload) {
    if (user.typeCompte === TypeCompte.ADMIN_PLATEFORME) {
      throw new ForbiddenException("Réservé aux comptes Organisation et Individuel");
    }

    const formation = await this.prisma.formation.findUnique({ where: { id: dto.formationId } });
    if (!formation || !formation.actif) {
      throw new NotFoundException("Formation introuvable ou indisponible");
    }

    // RM5 — le tarif catalogue est figé sur la réservation dès sa création
    // (le paiement suit immédiatement via le widget), jamais recalculé ensuite.
    const tarifApplique = this.tarifPourFormule(formation, dto.formule);

    return this.prisma.reservation.create({
      data: {
        formationId: formation.id,
        utilisateurId: user.sub,
        organisationId: user.organisationId,
        formule: dto.formule,
        tarifApplique,
      },
    });
  }

  async lister(query: ListReservationsQueryDto, user: JwtAccessPayload) {
    const estAdmin = user.roles.includes(RoleUtilisateur.ADMIN_PLATEFORME);
    return this.prisma.reservation.findMany({
      where: {
        statut: query.statut,
        ...(estAdmin ? {} : user.organisationId ? { organisationId: user.organisationId } : { utilisateurId: user.sub }),
      },
      include: { formation: true, facture: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async obtenir(id: string, user: JwtAccessPayload) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { formation: true, facture: true },
    });
    this.verifierAcces(reservation, user);
    return reservation;
  }

  // RM11 — revérification systématique côté serveur auprès de KKiaPay, jamais
  // fié au seul retour du widget (déclenché par le client une fois le paiement effectué).
  async verifierPaiement(id: string, dto: VerifierPaiementDto, user: JwtAccessPayload) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    this.verifierAcces(reservation, user);

    if (reservation.statut !== StatutReservation.ATTENTE_PAIEMENT) {
      if (reservation.statut === StatutReservation.PAYEE && reservation.kkiapayTransactionId === dto.transactionId) {
        return reservation; // idempotent : déjà confirmée avec la même transaction
      }
      throw new ConflictException(`Réservation déjà au statut ${reservation.statut}`);
    }

    let transaction;
    try {
      transaction = await this.kkiapay.verifierTransaction(dto.transactionId);
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : "Transaction introuvable";
      throw new BadRequestException(`Vérification KKiaPay échouée : ${message}`);
    }

    if (transaction.status !== "SUCCESS") {
      throw new BadRequestException(`Paiement non confirmé par KKiaPay (statut : ${transaction.status})`);
    }
    if (Number(transaction.amount) !== reservation.tarifApplique) {
      this.logger.warn(
        `Montant KKiaPay (${transaction.amount}) différent du tarif appliqué (${reservation.tarifApplique}) pour la réservation ${id}`,
      );
      throw new BadRequestException("Le montant payé ne correspond pas au tarif de la réservation");
    }

    return this.confirmerPaiement(reservation, dto.transactionId);
  }

  // Point d'entrée idempotent partagé avec le webhook (voir PaiementsWebhookController).
  async confirmerPaiement(reservation: Reservation, transactionId: string) {
    const numero = await this.genererNumeroFacture();

    const [misAJour] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { statut: StatutReservation.PAYEE, kkiapayTransactionId: transactionId },
      }),
      this.prisma.facture.create({
        data: { reservationId: reservation.id, numero, montant: reservation.tarifApplique },
      }),
    ]);

    await this.notifierUtilisateur(
      reservation.utilisateurId,
      "Paiement confirmé — une date de rendez-vous vous sera communiquée sous 48h",
    );

    return misAJour;
  }

  // 9.5 — fixation de la date de RDV par l'admin, fait passer PAYEE -> CONFIRMEE.
  async fixerDateRdv(id: string, dto: FixerDateRdvDto) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException("Réservation introuvable");
    if (reservation.statut !== StatutReservation.PAYEE) {
      throw new ConflictException("La date de RDV ne peut être fixée que sur une réservation payée");
    }

    const misAJour = await this.prisma.reservation.update({
      where: { id },
      data: { statut: StatutReservation.CONFIRMEE, dateRdv: new Date(dto.dateRdv) },
    });

    await this.notifierUtilisateur(
      reservation.utilisateurId,
      `Date de rendez-vous fixée : ${dto.dateRdv}`,
    );

    return misAJour;
  }

  // 9.12 — clôture de session + suivi de présence.
  async marquerRealisee(id: string, dto: MarquerRealiseeDto) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException("Réservation introuvable");
    if (reservation.statut !== StatutReservation.CONFIRMEE) {
      throw new ConflictException("Seule une réservation confirmée peut être marquée comme réalisée");
    }
    return this.prisma.reservation.update({
      where: { id },
      data: { statut: StatutReservation.REALISEE, presenceConfirmee: dto.presenceConfirmee ?? true },
    });
  }

  async annuler(id: string, user: JwtAccessPayload) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    this.verifierAcces(reservation, user);

    if (reservation.statut === StatutReservation.REALISEE || reservation.statut === StatutReservation.ANNULEE) {
      throw new ConflictException(`Impossible d'annuler une réservation ${reservation.statut}`);
    }

    return this.prisma.reservation.update({ where: { id }, data: { statut: StatutReservation.ANNULEE } });
  }

  private tarifPourFormule(formation: { prixIndividuel: number; prixGroupe5: number; prixGroupe10: number }, formule: FormuleFormation): number {
    switch (formule) {
      case FormuleFormation.INDIVIDUEL:
        return formation.prixIndividuel;
      case FormuleFormation.GROUPE_5:
        return formation.prixGroupe5;
      case FormuleFormation.GROUPE_10:
        return formation.prixGroupe10;
    }
  }

  private async genererNumeroFacture(): Promise<string> {
    const annee = new Date().getFullYear();
    const total = await this.prisma.facture.count();
    return `FAC-${annee}-${String(total + 1).padStart(6, "0")}`;
  }

  private async notifierUtilisateur(utilisateurId: string, message: string): Promise<void> {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (utilisateur) {
      await this.mailer.sendNotificationGenerique(utilisateur.email, message);
    }
  }

  // RM7 (par analogie) — seul le propriétaire (organisation ou individuel) ou
  // l'admin plateforme peut accéder à une réservation.
  private verifierAcces<T extends Reservation | null>(
    reservation: T,
    user: JwtAccessPayload,
  ): asserts reservation is NonNullable<T> {
    if (!reservation) throw new NotFoundException("Réservation introuvable");
    const estProprietaire = user.organisationId
      ? reservation.organisationId === user.organisationId
      : reservation.utilisateurId === user.sub;
    const estAdmin = user.roles.includes(RoleUtilisateur.ADMIN_PLATEFORME);
    if (!estProprietaire && !estAdmin) {
      throw new NotFoundException("Réservation introuvable");
    }
  }
}
