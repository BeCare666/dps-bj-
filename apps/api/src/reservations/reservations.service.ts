import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { KkiapayService } from "../paiements/kkiapay.service.js";
import { MailerService } from "../notifications/mailer.service.js";
import { NotificationsInternesService } from "../notifications-internes/notifications-internes.service.js";
import { FacturesService } from "../factures/factures.service.js";
import { FormuleFormation, RoleUtilisateur, StatutReservation, StatutSessionFormation, TypeCompte } from "../generated/prisma/enums.js";
import type { Reservation } from "../generated/prisma/client.js";
import type { JwtAccessPayload } from "../auth/types/jwt-payload.type.js";
import type { CreerReservationDto } from "./dto/creer-reservation.dto.js";
import type { VerifierPaiementDto } from "./dto/verifier-paiement.dto.js";
import type { MarquerRealiseeDto } from "./dto/marquer-realisee.dto.js";
import type { ListReservationsQueryDto } from "./dto/list-reservations-query.dto.js";
import type { AffecterSessionDto } from "./sessions/dto/session-formation.dto.js";
import { InvitationsFormationService, formaterDateSession } from "./sessions/invitations-formation.service.js";

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kkiapay: KkiapayService,
    private readonly mailer: MailerService,
    private readonly notificationsInternes: NotificationsInternesService,
    private readonly factures: FacturesService,
    private readonly invitations: InvitationsFormationService,
  ) {}

  // 9.1/9.2/9.9 — Organisation et Individuel peuvent réserver, pas l'admin plateforme.
  async creer(dto: CreerReservationDto, user: JwtAccessPayload) {
    if (user.typeCompte === TypeCompte.ADMIN_PLATEFORME) {
      throw new ForbiddenException("Réservé aux comptes Organisation et Individuel");
    }
    this.exigerAccesModuleFormation(user);

    const formation = await this.prisma.formation.findUnique({ where: { id: dto.formationId } });
    if (!formation || !formation.actif) {
      throw new NotFoundException("Formation introuvable ou indisponible");
    }

    // RM5 — le tarif catalogue est figé sur la réservation dès sa création
    // (le paiement suit immédiatement via le widget), jamais recalculé ensuite.
    const tarifApplique = this.tarifPourFormule(formation, dto.formule);
    if (dto.sessionFormationId) await this.exigerSessionOuverte(dto.sessionFormationId, formation.id);

    return this.prisma.reservation.create({
      data: {
        formationId: formation.id,
        utilisateurId: user.sub,
        organisationId: user.organisationId,
        formule: dto.formule,
        tarifApplique,
        sessionFormationId: dto.sessionFormationId ?? null,
      },
    });
  }

  async lister(query: ListReservationsQueryDto, user: JwtAccessPayload) {
    const estAdmin = user.roles.includes(RoleUtilisateur.ADMIN_PLATEFORME);
    if (!estAdmin) this.exigerAccesModuleFormation(user);
    return this.prisma.reservation.findMany({
      where: {
        statut: query.statut,
        ...(estAdmin ? {} : user.organisationId ? { organisationId: user.organisationId } : { utilisateurId: user.sub }),
      },
      include: {
        formation: true,
        facture: true,
        // Utile côté admin (annuaire du client de la réservation) ; sans effet
        // pour un compte non-admin, qui connaît déjà son propre profil.
        utilisateur: { select: { id: true, nom: true, prenom: true, email: true } },
        organisation: { select: { id: true, nom: true } },
        sessionFormation: { select: { id: true, debut: true, fin: true, statut: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async obtenir(id: string, user: JwtAccessPayload) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        formation: true,
        facture: true,
        sessionFormation: true,
        participants: { orderBy: [{ nom: "asc" }, { prenom: "asc" }] },
      },
    });
    this.verifierAcces(reservation, user);
    // §4.4 — lien et code Meet communiqués une fois le paiement confirmé.
    const payee = reservation.statut !== StatutReservation.ATTENTE_PAIEMENT && reservation.statut !== StatutReservation.ANNULEE;
    if (reservation.sessionFormation && !payee) {
      return { ...reservation, sessionFormation: { ...reservation.sessionFormation, lienMeet: null, codeMeet: null } };
    }
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
    // Session choisie à la réservation et toujours ouverte : la réservation est
    // confirmée d'emblée ; sinon DSP l'affecte à une session (affecterSession).
    const session = reservation.sessionFormationId
      ? await this.prisma.sessionFormation.findUnique({ where: { id: reservation.sessionFormationId } })
      : null;
    const sessionOuverte = session && session.statut === StatutSessionFormation.PLANIFIEE && session.debut > new Date() ? session : null;
    const misAJour = await this.prisma.$transaction(async (tx) => {
      const maj = await tx.reservation.update({
        where: { id: reservation.id },
        data: sessionOuverte
          ? { statut: StatutReservation.CONFIRMEE, kkiapayTransactionId: transactionId, dateRdv: sessionOuverte.debut }
          : { statut: StatutReservation.PAYEE, kkiapayTransactionId: transactionId, sessionFormationId: null },
      });
      // §11.1 — facture émise automatiquement (numérotation commune aux abonnements).
      await this.factures.creerDansTransaction(tx, {
        reservationId: reservation.id,
        montant: reservation.tarifApplique,
        devise: process.env.DEVISE_PAR_DEFAUT ?? "XOF",
      });
      return maj;
    });

    await this.notifierUtilisateur(
      reservation.utilisateurId,
      sessionOuverte
        ? `Paiement confirmé. Session en ligne le ${formaterDateSession(sessionOuverte.debut)} : chaque participant inscrit reçoit le lien Google Meet par email.`
        : "Paiement confirmé. Une session en ligne vous sera affectée sous 48 h ; inscrivez dès maintenant vos participants.",
      { titre: "Paiement de formation confirmé", lienUrl: `/mes-reservations/${reservation.id}` },
    );
    if (sessionOuverte) await this.invitations.envoyerPourReservation(reservation.id);

    const formation = await this.prisma.formation.findUnique({
      where: { id: reservation.formationId },
      select: { titre: true },
    });
    await this.notificationsInternes.creerPourAdmins({
      type: "RESERVATION_PAYEE",
      titre: sessionOuverte ? "Réservation payée" : "Réservation payée, session à affecter",
      message: `${formation?.titre ?? "Une formation"} · ${reservation.tarifApplique.toLocaleString("fr-FR")} FCFA`,
      lienUrl: "/admin/reservations",
    });

    return misAJour;
  }

  // §4.2 — affectation (ou changement) de la session en ligne par DSP après
  // paiement : la réservation passe confirmée, ses participants sont invités.
  async affecterSession(id: string, dto: AffecterSessionDto) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException("Réservation introuvable");
    if (reservation.statut !== StatutReservation.PAYEE && reservation.statut !== StatutReservation.CONFIRMEE) {
      throw new ConflictException("Seule une réservation payée peut être affectée à une session");
    }
    const session = await this.exigerSessionOuverte(dto.sessionFormationId, reservation.formationId);
    const changement = reservation.sessionFormationId !== session.id;
    const misAJour = await this.prisma.$transaction(async (tx) => {
      if (changement) {
        await tx.participantFormation.updateMany({ where: { reservationId: id }, data: { invitationEnvoyeeLe: null } });
      }
      return tx.reservation.update({
        where: { id },
        data: {
          sessionFormationId: session.id,
          statut: StatutReservation.CONFIRMEE,
          dateRdv: session.debut,
          ...(changement ? { rappelEnvoyeLe: null } : {}),
        },
      });
    });
    await this.invitations.envoyerPourReservation(id);
    await this.notifierUtilisateur(
      reservation.utilisateurId,
      `Session en ligne fixée : ${formaterDateSession(session.debut)}. Chaque participant inscrit reçoit le lien Google Meet par email.`,
      { titre: "Session de formation fixée", lienUrl: `/mes-reservations/${reservation.id}` },
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
    const places = { [FormuleFormation.INDIVIDUEL]: 1, [FormuleFormation.GROUPE_5]: 5, [FormuleFormation.GROUPE_10]: 10 }[reservation.formule];
    if (dto.participantsPresents !== undefined && dto.participantsPresents > places) {
      throw new BadRequestException(`La formule réservée compte au plus ${places} participant(s)`);
    }
    const participantsPresents = dto.participantsPresents ?? (dto.presenceConfirmee === false ? 0 : undefined);
    return this.prisma.reservation.update({
      where: { id },
      data: {
        statut: StatutReservation.REALISEE,
        presenceConfirmee: dto.presenceConfirmee ?? (participantsPresents === undefined ? true : participantsPresents > 0),
        participantsPresents,
      },
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

  private async exigerSessionOuverte(sessionFormationId: string, formationId: string) {
    const session = await this.prisma.sessionFormation.findUnique({ where: { id: sessionFormationId } });
    if (!session || session.formationId !== formationId) throw new NotFoundException("Session introuvable pour cette formation");
    if (session.statut !== StatutSessionFormation.PLANIFIEE || session.debut <= new Date()) {
      throw new ConflictException("Cette session n'est plus ouverte aux inscriptions");
    }
    return session;
  }

  // Les tarifs ne figurent pas dans les documents officiels : tant que DSP ne
  // les a pas fixés dans l'admin, la formule n'est pas réservable.
  private tarifPourFormule(
    formation: { prixIndividuel: number | null; prixGroupe5: number | null; prixGroupe10: number | null },
    formule: FormuleFormation,
  ): number {
    const tarif = {
      [FormuleFormation.INDIVIDUEL]: formation.prixIndividuel,
      [FormuleFormation.GROUPE_5]: formation.prixGroupe5,
      [FormuleFormation.GROUPE_10]: formation.prixGroupe10,
    }[formule];
    if (tarif === null || tarif === undefined) {
      throw new BadRequestException("Tarif à définir : cette formule n'est pas encore réservable");
    }
    return tarif;
  }

  // §11.2 — email + notification dans l'espace personnel.
  private async notifierUtilisateur(
    utilisateurId: string,
    message: string,
    inApp: { titre: string; lienUrl: string },
  ): Promise<void> {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (utilisateur) {
      await this.mailer.sendNotificationGenerique(utilisateur.email, message);
      await this.notificationsInternes.creerPour([utilisateur.id], { type: "FORMATION", message, ...inApp });
    }
  }

  // §4.2 — dans un compte Organisation, le module Formation est ouvert au
  // responsable du compte (accès complet) et au gestionnaire formation. Un
  // compte Individuel (sans rôle) accède toujours à ses propres réservations.
  private exigerAccesModuleFormation(user: JwtAccessPayload): void {
    if (!user.organisationId) return;
    const autorise =
      user.roles.includes(RoleUtilisateur.RESPONSABLE_COMPTE) || user.roles.includes(RoleUtilisateur.GESTIONNAIRE_FORMATION);
    if (!autorise) {
      throw new ForbiddenException("Le module Formation est réservé au responsable du compte et au gestionnaire formation");
    }
  }

  // RM7 (par analogie) — seul le propriétaire (organisation ou individuel) ou
  // l'admin plateforme peut accéder à une réservation.
  private verifierAcces<T extends Reservation | null>(
    reservation: T,
    user: JwtAccessPayload,
  ): asserts reservation is NonNullable<T> {
    if (!reservation) throw new NotFoundException("Réservation introuvable");
    if (!user.roles.includes(RoleUtilisateur.ADMIN_PLATEFORME)) this.exigerAccesModuleFormation(user);
    const estProprietaire = user.organisationId
      ? reservation.organisationId === user.organisationId
      : reservation.utilisateurId === user.sub;
    const estAdmin = user.roles.includes(RoleUtilisateur.ADMIN_PLATEFORME);
    if (!estProprietaire && !estAdmin) {
      throw new NotFoundException("Réservation introuvable");
    }
  }
}
