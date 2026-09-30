import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { StatutSessionEvaluation } from "../generated/prisma/enums.js";

// D6 — agrégats plateforme uniquement (comptages/moyennes), jamais de donnée
// individuelle/identifiante (RM7 + principe du moindre privilège). Chaque
// métrique est un instantané calculé en direct depuis les tables réelles —
// aucune valeur simulée, aucun Math.random(). Voir ROADMAP.md D6 pour la
// définition exacte de chaque métrique (source, portée, méthode de calcul).
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenirAnalytics() {
    const [
      etablissements,
      etablissementsParType,
      utilisateursTotal,
      utilisateursActifs,
      rolesGroupes,
      reservationsGroupees,
      formationsTotal,
      formationsActives,
      sessionsSoumises,
      eiBruts,
      newsGroupees,
    ] = await Promise.all([
      this.prisma.organisation.groupBy({ by: ["actif"], _count: { _all: true } }),
      this.prisma.organisation.groupBy({ by: ["type"], _count: { _all: true } }),
      this.prisma.utilisateur.count(),
      this.prisma.utilisateur.count({ where: { actif: true } }),
      this.prisma.utilisateurRole.groupBy({ by: ["role"], _count: { _all: true } }),
      this.prisma.reservation.groupBy({ by: ["statut"], _count: { _all: true } }),
      this.prisma.formation.count(),
      this.prisma.formation.count({ where: { actif: true } }),
      this.prisma.sessionEvaluation.findMany({
        where: { statut: StatutSessionEvaluation.SOUMISE },
        select: { scoreGlobal: true, organisation: { select: { type: true } } },
      }),
      this.prisma.evenementIndesirable.findMany({
        select: { statut: true, gravite: true, dateDeclaration: true, dateCloture: true },
      }),
      this.prisma.mesureNews.groupBy({ by: ["niveauRisque"], _count: { _all: true } }),
    ]);

    // M1 — Établissements (Organisation.actif / .type, comptage).
    const m1Etablissements = {
      total: etablissementsParType.reduce((s, g) => s + g._count._all, 0),
      actifs: etablissements.find((g) => g.actif)?._count._all ?? 0,
      inactifs: etablissements.find((g) => !g.actif)?._count._all ?? 0,
      parType: Object.fromEntries(etablissementsParType.map((g) => [g.type, g._count._all])),
    };

    // M2 — Utilisateurs (Utilisateur.actif, UtilisateurRole groupé par rôle).
    const m2Utilisateurs = {
      total: utilisateursTotal,
      actifs: utilisateursActifs,
      inactifs: utilisateursTotal - utilisateursActifs,
      parRole: Object.fromEntries(rolesGroupes.map((g) => [g.role, g._count._all])),
    };

    // M3 — Réservations par statut (Reservation.statut, snapshot).
    const m3Reservations = Object.fromEntries(reservationsGroupees.map((g) => [g.statut, g._count._all]));

    // M4 — Formations actives/inactives (Formation.actif).
    const m4Formations = { total: formationsTotal, actives: formationsActives, inactives: formationsTotal - formationsActives };

    // M5 — Score moyen d'auto-évaluation (SessionEvaluation.scoreGlobal, sessions
    // SOUMISE uniquement), par type d'établissement — aucune donnée patient.
    const scoresParType = new Map<string, number[]>();
    for (const s of sessionsSoumises) {
      if (s.scoreGlobal === null) continue;
      const type = s.organisation.type;
      if (!scoresParType.has(type)) scoresParType.set(type, []);
      scoresParType.get(type)!.push(s.scoreGlobal);
    }
    const m5AutoEvaluation = {
      nombreSessionsSoumises: sessionsSoumises.length,
      scoreMoyenParType: Object.fromEntries(
        [...scoresParType.entries()].map(([type, scores]) => [
          type,
          Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
        ]),
      ),
    };

    // M6 — Événements indésirables plateforme (mêmes calculs que le tableau de
    // bord par organisation, sans filtre organisationId ; aucun champ
    // `description` chargé — uniquement statut/gravité/dates).
    const parStatutEi: Record<string, number> = {};
    const parGraviteEi: Record<string, number> = {};
    let sommeDelaisJours = 0;
    let nombreClotures = 0;
    for (const e of eiBruts) {
      parStatutEi[e.statut] = (parStatutEi[e.statut] ?? 0) + 1;
      if (e.gravite) parGraviteEi[e.gravite] = (parGraviteEi[e.gravite] ?? 0) + 1;
      if (e.dateCloture) {
        nombreClotures++;
        sommeDelaisJours += (e.dateCloture.getTime() - e.dateDeclaration.getTime()) / 86_400_000;
      }
    }
    const m6EvenementsIndesirables = {
      total: eiBruts.length,
      parStatut: parStatutEi,
      parGravite: parGraviteEi,
      tauxClotureePct: eiBruts.length ? Math.round((nombreClotures / eiBruts.length) * 10000) / 100 : 0,
      delaiMoyenClotureJours: nombreClotures ? Math.round((sommeDelaisJours / nombreClotures) * 10) / 10 : null,
    };

    // M7 — Volume de mesures NEWS par niveau de risque (activité, pas
    // d'identité patient — MesureNews.niveauRisque, comptage global).
    const m7MesuresNews = Object.fromEntries(newsGroupees.map((g) => [g.niveauRisque, g._count._all]));

    return {
      etablissements: m1Etablissements,
      utilisateurs: m2Utilisateurs,
      reservationsParStatut: m3Reservations,
      formations: m4Formations,
      autoEvaluation: m5AutoEvaluation,
      evenementsIndesirables: m6EvenementsIndesirables,
      mesuresNewsParNiveau: m7MesuresNews,
    };
  }
}
