import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { PrismaService } from "../../prisma/prisma.service.js";
import { FormuleFormation, StatutReservation, StatutSessionFormation } from "../../generated/prisma/enums.js";
import type { JwtAccessPayload } from "../../auth/types/jwt-payload.type.js";
import { ecrireEnTeteDsp } from "../../pdf-entete.js";
import { ReservationsService } from "../reservations.service.js";
import { InvitationsFormationService, formaterDateSession } from "./invitations-formation.service.js";
import { SessionsFormationService } from "./sessions-formation.service.js";
import type { AjouterParticipantDto } from "./dto/session-formation.dto.js";

export const PLACES_PAR_FORMULE: Record<FormuleFormation, number> = {
  [FormuleFormation.INDIVIDUEL]: 1,
  [FormuleFormation.GROUPE_5]: 5,
  [FormuleFormation.GROUPE_10]: 10,
};

const champCsv = (valeur: string | null | undefined) => `"${(valeur ?? "").replace(/"/g, '""')}"`;

// §4.3, §4.6 — participants inscrits par l'établissement et registre du
// personnel formé (participants présents d'une session clôturée).
@Injectable()
export class ParticipantsFormationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationsService,
    private readonly sessions: SessionsFormationService,
    private readonly invitations: InvitationsFormationService,
  ) {}

  async lister(reservationId: string, user: JwtAccessPayload) {
    await this.reservations.obtenir(reservationId, user);
    return this.prisma.participantFormation.findMany({
      where: { reservationId },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });
  }

  async ajouter(reservationId: string, dto: AjouterParticipantDto, user: JwtAccessPayload) {
    const reservation = await this.exigerModifiable(reservationId, user);
    const inscrits = await this.prisma.participantFormation.count({ where: { reservationId } });
    const places = PLACES_PAR_FORMULE[reservation.formule];
    if (inscrits >= places) {
      throw new BadRequestException(`La formule réservée compte au plus ${places} participant(s)`);
    }
    if (reservation.sessionFormation?.placesMax) {
      const total = await this.sessions.compterParticipants(reservation.sessionFormation.id);
      if (total >= reservation.sessionFormation.placesMax) throw new ConflictException("La session est complète");
    }
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.participantFormation.findFirst({ where: { reservationId, email } })) {
      throw new ConflictException("Ce participant est déjà inscrit (même email)");
    }
    const participant = await this.prisma.participantFormation.create({
      data: {
        reservationId,
        nom: dto.nom.trim(),
        prenom: dto.prenom.trim(),
        fonction: dto.fonction.trim(),
        service: dto.service?.trim() || null,
        email,
        telephone: dto.telephone?.trim() || null,
      },
    });
    // Paiement confirmé et session connue : l'invitation part aussitôt.
    await this.invitations.envoyerPourReservation(reservationId);
    return this.prisma.participantFormation.findUniqueOrThrow({ where: { id: participant.id } });
  }

  async retirer(reservationId: string, participantId: string, user: JwtAccessPayload) {
    await this.exigerModifiable(reservationId, user);
    const supprime = await this.prisma.participantFormation.deleteMany({ where: { id: participantId, reservationId } });
    if (supprime.count === 0) throw new NotFoundException("Participant introuvable");
  }

  // Registre : participants présents d'une session clôturée.
  async registre(reservationId: string, user: JwtAccessPayload) {
    await this.reservations.obtenir(reservationId, user);
    const reservation = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: reservationId },
      include: {
        formation: { select: { titre: true, critere: true, typeEtablissement: true, dureeLibelle: true } },
        organisation: { select: { nom: true } },
        sessionFormation: { select: { debut: true, fin: true, statut: true } },
        participants: { where: { present: true }, orderBy: [{ nom: "asc" }, { prenom: "asc" }] },
      },
    });
    if (reservation.sessionFormation?.statut !== StatutSessionFormation.TERMINEE) {
      throw new ConflictException("Le registre est disponible une fois la session clôturée par DSP");
    }
    return reservation;
  }

  async registreCsv(reservationId: string, user: JwtAccessPayload): Promise<string> {
    const r = await this.registre(reservationId, user);
    const entete = ["nom", "prenom", "fonction", "service", "email", "telephone", "formation", "critere", "date_session"];
    const date = formaterDateSession(r.sessionFormation!.debut);
    const lignes = r.participants.map((p) =>
      [p.nom, p.prenom, p.fonction, p.service, p.email, p.telephone, r.formation.titre, r.formation.critere, date].map(champCsv).join(","),
    );
    // BOM : ouverture correcte des accents dans Excel.
    return "﻿" + [entete.map(champCsv).join(","), ...lignes].join("\r\n") + "\r\n";
  }

  async registrePdf(reservationId: string, user: JwtAccessPayload): Promise<Buffer> {
    const r = await this.registre(reservationId, user);
    return new Promise((resoudre, rejeter) => {
      const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: `Registre du personnel formé — ${r.formation.titre}` } });
      const morceaux: Buffer[] = [];
      doc.on("data", (m: Buffer) => morceaux.push(m));
      doc.on("end", () => resoudre(Buffer.concat(morceaux)));
      doc.on("error", rejeter);

      ecrireEnTeteDsp(doc, "Registre du personnel formé");
      doc.moveDown(1.5).fontSize(14).font("Helvetica-Bold").text(r.formation.titre);
      doc.font("Helvetica").fontSize(10);
      if (r.formation.critere) doc.text(`Critère ARS ${r.formation.typeEtablissement ?? ""} ${r.formation.critere}`.replace("  ", " "));
      if (r.organisation) doc.text(`Établissement : ${r.organisation.nom}`);
      doc.text(`Session en ligne : ${formaterDateSession(r.sessionFormation!.debut)} au ${formaterDateSession(r.sessionFormation!.fin)}`);
      if (r.formation.dureeLibelle) doc.text(`Durée : ${r.formation.dureeLibelle}`);
      doc.text(`Participants présents : ${r.participants.length}`);
      doc.moveDown(1);
      r.participants.forEach((p, i) => {
        doc.font("Helvetica-Bold").text(`${i + 1}. ${p.nom} ${p.prenom}`, { continued: true });
        doc.font("Helvetica").text(` · ${p.fonction}${p.service ? ` · ${p.service}` : ""} · ${p.email}`);
      });
      doc.moveDown(1).fontSize(8).fillColor("#5B6472").text(`Présences relevées par DSP. Document généré le ${new Date().toLocaleDateString("fr-FR")}.`);
      doc.end();
    });
  }

  // Ajout et retrait possibles jusqu'au début de la session, tant que la
  // réservation n'est ni annulée ni réalisée.
  private async exigerModifiable(reservationId: string, user: JwtAccessPayload) {
    await this.reservations.obtenir(reservationId, user);
    const reservation = await this.prisma.reservation.findUniqueOrThrow({
      where: { id: reservationId },
      include: { sessionFormation: true },
    });
    if (reservation.statut === StatutReservation.ANNULEE || reservation.statut === StatutReservation.REALISEE) {
      throw new ConflictException("Réservation annulée ou réalisée : participants non modifiables");
    }
    if (reservation.sessionFormation && reservation.sessionFormation.debut <= new Date()) {
      throw new ConflictException("La session a commencé : participants non modifiables");
    }
    return reservation;
  }
}
