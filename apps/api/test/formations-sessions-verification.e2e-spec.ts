import { Test, type TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request from "supertest";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { MailerService } from "../src/notifications/mailer.service.js";
import { CloudinaryService } from "../src/cloudinary/cloudinary.service.js";
import { ReservationsService } from "../src/reservations/reservations.service.js";
import { RoleUtilisateur, SourceEvaluationExterne, StatutReservation, TypeCompte, TypeEtablissement } from "../src/generated/prisma/enums.js";

// ROADMAP_FORMATIONS_VERIFICATION.md §3 à §5 : tarifs par personne, sessions en
// ligne, participants, invitations Meet, présence, registre, vérification.
describe("Formations en ligne et vérification des établissements (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let reservations: ReservationsService;

  const motDePasse = "TestFormSess!2026";
  const suffixe = randomUUID().slice(0, 8);
  const ifu = `fsv-${suffixe}`;
  const invitations: { email: string; lienMeet: string }[] = [];
  const idsUtilisateurs: string[] = [];
  const idsFormations: string[] = [];
  let orgId: string;
  let respId: string;
  const emails = { resp: `fsv-resp-${suffixe}@example.test`, admin: `fsv-admin-${suffixe}@example.test` };

  const cache = new Map<string, string>();
  async function connecter(email: string): Promise<string> {
    if (cache.has(email)) return cache.get(email)!;
    const res = await request(app.getHttpServer()).post("/auth/login").send({ email, motDePasse }).expect(200);
    const cookie = (res.headers["set-cookie"] as unknown as string[]).map((c) => c.split(";")[0]).join("; ");
    cache.set(email, cookie);
    return cookie;
  }
  const http = () => request(app.getHttpServer());

  async function creerUtilisateur(email: string, role: RoleUtilisateur, organisationId: string | null) {
    const u = await prisma.utilisateur.create({
      data: {
        organisationId,
        typeCompte: organisationId ? TypeCompte.ORGANISATION : TypeCompte.ADMIN_PLATEFORME,
        email,
        motDePasseHash: await bcrypt.hash(motDePasse, 4),
        nom: "Test",
        prenom: "FSV",
        emailVerifieLe: new Date(),
        roles: { create: { role } },
      },
    });
    idsUtilisateurs.push(u.id);
    return u.id;
  }

  // Sans prix : tarifs par défaut (5 000 / 3 000 / 2 000 FCFA par personne).
  async function creerFormation(prix?: number) {
    const f = await prisma.formation.create({
      data: {
        titre: `Formation FSV ${suffixe}`,
        description: "Formation de test supprimée après exécution.",
        typeEtablissement: TypeEtablissement.EH,
        critere: "C.2.1.1",
        ...(prix === undefined ? {} : { prixPersonne1a5: prix }),
      },
    });
    idsFormations.push(f.id);
    return f.id;
  }

  beforeAll(async () => {
    const rien = vi.fn(async () => true);
    const mailerFactice = {
      sendNotificationGenerique: rien,
      sendInvitationSessionFormation: vi.fn(async (p: { email: string; lienMeet: string }) => {
        invitations.push({ email: p.email, lienMeet: p.lienMeet });
        return true;
      }),
    };
    const cloudinaryFactice = {
      uploadBuffer: vi.fn(async () => ({ url: "https://res.cloudinary.com/test/document.pdf", cloudinaryId: `test/${suffixe}` })),
      supprimer: vi.fn(async () => {}),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailerService)
      .useValue(mailerFactice)
      .overrideProvider(CloudinaryService)
      .useValue(cloudinaryFactice)
      .compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = moduleFixture.get(PrismaService);
    reservations = moduleFixture.get(ReservationsService);

    orgId = (await prisma.organisation.create({
      data: { nom: `Clinique FSV ${suffixe}`, ifu, type: TypeEtablissement.EH, ville: "Cotonou" },
    })).id;
    respId = await creerUtilisateur(emails.resp, RoleUtilisateur.RESPONSABLE_COMPTE, orgId);
    await creerUtilisateur(emails.admin, RoleUtilisateur.ADMIN_PLATEFORME, null);
  });

  afterAll(async () => {
    const idsReservations = (await prisma.reservation.findMany({ where: { utilisateurId: respId }, select: { id: true } })).map((r) => r.id);
    await prisma.facture.deleteMany({ where: { reservationId: { in: idsReservations } } });
    await prisma.reservation.deleteMany({ where: { id: { in: idsReservations } } });
    await prisma.sessionFormation.deleteMany({ where: { formationId: { in: idsFormations } } });
    await prisma.formation.deleteMany({ where: { id: { in: idsFormations } } });
    await prisma.evaluationExterne.deleteMany({ where: { OR: [{ ifu }, { organisationId: orgId }] } });
    await prisma.notification.deleteMany({ where: { destinataireId: { in: idsUtilisateurs } } });
    await prisma.journalAudit.deleteMany({ where: { OR: [{ organisationId: orgId }, { utilisateurId: { in: idsUtilisateurs } }] } });
    await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: idsUtilisateurs } } });
    await prisma.utilisateur.deleteMany({ where: { id: { in: idsUtilisateurs } } });
    await prisma.organisation.delete({ where: { id: orgId } });
    await app.close();
  });

  it("§3.3 — tarifs par défaut : prix par personne selon la taille du groupe", async () => {
    const formationId = await creerFormation();
    const resp = await connecter(emails.resp);
    const reserver = async (nombrePlaces: number) =>
      (await http().post("/reservations").set("Cookie", resp).send({ formationId, nombrePlaces }).expect(201)).body;
    expect(await reserver(5)).toMatchObject({ nombrePlaces: 5, prixParPersonne: 5000, tarifApplique: 25000 });
    expect(await reserver(7)).toMatchObject({ nombrePlaces: 7, prixParPersonne: 3000, tarifApplique: 21000 });
    expect(await reserver(11)).toMatchObject({ nombrePlaces: 11, prixParPersonne: 2000, tarifApplique: 22000 });
    await http().post("/reservations").set("Cookie", resp).send({ formationId, nombrePlaces: 0 }).expect(400);
  });

  it("§4 — session, participants, invitations Meet, présence et registre", async () => {
    const formationId = await creerFormation(10000);
    const admin = await connecter(emails.admin);
    const resp = await connecter(emails.resp);
    const debut = new Date(Date.now() + 2 * 86_400_000);
    const session = (
      await http()
        .post("/sessions-formation")
        .set("Cookie", admin)
        .send({ formationId, debut: debut.toISOString(), fin: new Date(debut.getTime() + 3 * 3_600_000).toISOString(), lienMeet: "https://meet.google.com/aaa-bbbb-ccc", codeMeet: "123456" })
        .expect(201)
    ).body;

    // Le catalogue public montre la session sans le lien Meet.
    const fiche = (await http().get(`/formations/${formationId}`).expect(200)).body;
    expect(fiche.sessions.map((s: { id: string }) => s.id)).toContain(session.id);
    expect(fiche.sessions[0].lienMeet).toBeUndefined();

    const reservation = (
      await http().post("/reservations").set("Cookie", resp).send({ formationId, nombrePlaces: 5, sessionFormationId: session.id }).expect(201)
    ).body;

    // Avant paiement : participant inscrit, aucune invitation, lien masqué.
    const p1 = (
      await http()
        .post(`/reservations/${reservation.id}/participants`)
        .set("Cookie", resp)
        .send({ nom: "Agbo", prenom: "Rita", fonction: "Infirmière", email: `rita-${suffixe}@example.test` })
        .expect(201)
    ).body;
    expect(invitations).toHaveLength(0);
    expect((await http().get(`/reservations/${reservation.id}`).set("Cookie", resp).expect(200)).body.sessionFormation.lienMeet).toBeNull();

    // Paiement confirmé (chemin partagé avec le webhook KKiaPay) : confirmée et invitations envoyées.
    const brute = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } });
    await reservations.confirmerPaiement(brute, `tx-fsv-${suffixe}`);
    const apresPaiement = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id } });
    expect(apresPaiement.statut).toBe(StatutReservation.CONFIRMEE);
    expect(invitations.map((i) => i.email)).toEqual([`rita-${suffixe}@example.test`]);

    // Participant ajouté ensuite : invité aussitôt ; doublon refusé.
    const p2 = (
      await http()
        .post(`/reservations/${reservation.id}/participants`)
        .set("Cookie", resp)
        .send({ nom: "Houngbo", prenom: "Marc", fonction: "Aide-soignant", email: `marc-${suffixe}@example.test` })
        .expect(201)
    ).body;
    expect(p2.invitationEnvoyeeLe).not.toBeNull();
    await http()
      .post(`/reservations/${reservation.id}/participants`)
      .set("Cookie", resp)
      .send({ nom: "Agbo", prenom: "Rita", fonction: "Infirmière", email: `RITA-${suffixe}@example.test` })
      .expect(409);

    // Changement de lien : invitations renvoyées à tous avec le nouveau lien.
    await http().patch(`/sessions-formation/${session.id}`).set("Cookie", admin).send({ lienMeet: "https://meet.google.com/zzz-yyyy-xxx" }).expect(200);
    expect(invitations.filter((i) => i.lienMeet === "https://meet.google.com/zzz-yyyy-xxx")).toHaveLength(2);

    // Clôture impossible avant le début ; registre indisponible avant clôture.
    await http().post(`/sessions-formation/${session.id}/cloturer`).set("Cookie", admin).expect(409);
    await http().get(`/reservations/${reservation.id}/participants/registre`).set("Cookie", resp).expect(409);

    // Session commencée : présence de Rita seulement, puis clôture.
    await prisma.sessionFormation.update({ where: { id: session.id }, data: { debut: new Date(Date.now() - 3_600_000) } });
    await http()
      .post(`/reservations/${reservation.id}/participants`)
      .set("Cookie", resp)
      .send({ nom: "Tard", prenom: "Venu", fonction: "Sage-femme", email: `tard-${suffixe}@example.test` })
      .expect(409);
    await http().put(`/sessions-formation/${session.id}/presences`).set("Cookie", admin).send({ presences: [{ participantId: p1.id, present: true }] }).expect(200);
    await http().post(`/sessions-formation/${session.id}/cloturer`).set("Cookie", admin).expect(201);

    const realisee = await prisma.reservation.findUniqueOrThrow({ where: { id: reservation.id }, include: { participants: true } });
    expect(realisee.statut).toBe(StatutReservation.REALISEE);
    expect(realisee.participantsPresents).toBe(1);
    expect(realisee.participants.find((p) => p.id === p2.id)?.present).toBe(false);

    const registre = (await http().get(`/reservations/${reservation.id}/participants/registre`).set("Cookie", resp).expect(200)).body;
    expect(registre.participants.map((p: { id: string }) => p.id)).toEqual([p1.id]);
    const csv = (await http().get(`/reservations/${reservation.id}/participants/registre.csv`).set("Cookie", resp).expect(200)).text;
    expect(csv).toContain("Agbo");
    expect(csv).not.toContain("Houngbo");
    const pdf = await http().get(`/reservations/${reservation.id}/participants/registre.pdf`).set("Cookie", resp).expect(200);
    expect(pdf.headers["content-type"]).toContain("application/pdf");
    // Scénario complet : une vingtaine d'allers-retours vers TiDB Cloud.
  }, 180_000);

  it("§4.3 — participants limités aux places réservées", async () => {
    const formationId = await creerFormation(5000);
    const resp = await connecter(emails.resp);
    const reservation = (await http().post("/reservations").set("Cookie", resp).send({ formationId, nombrePlaces: 1 }).expect(201)).body;
    const participant = (n: string) => ({ nom: n, prenom: "Test", fonction: "Infirmier", email: `${n.toLowerCase()}-${suffixe}@example.test` });
    await http().post(`/reservations/${reservation.id}/participants`).set("Cookie", resp).send(participant("Un")).expect(201);
    await http().post(`/reservations/${reservation.id}/participants`).set("Cookie", resp).send(participant("Deux")).expect(400);
  });

  it("§5 — évaluation externe rattachée par IFU, publiée dans la recherche et sur l'espace de l'établissement", async () => {
    const admin = await connecter(emails.admin);
    await http()
      .post("/evaluations-externes")
      .set("Cookie", admin)
      .field("nomEtablissement", `Clinique FSV ${suffixe}`)
      .field("typeEtablissement", "EH")
      .field("ifu", ifu)
      .field("source", SourceEvaluationExterne.ARS)
      .field("niveau", "3")
      .field("dateEvaluation", "2025-06-15")
      .field("pctEssentiels", "100")
      .attach("document", Buffer.from("%PDF-1.4 test"), { filename: "rapport-ars.pdf", contentType: "application/pdf" })
      .expect(201);
    const enregistree = await prisma.evaluationExterne.findFirstOrThrow({ where: { ifu } });
    expect(enregistree.organisationId).toBe(orgId);

    const resultats = (await http().get(`/verification/etablissements?q=${encodeURIComponent(`FSV ${suffixe}`)}`).expect(200)).body;
    const sources = resultats.map((r: { source: string; niveau: number | null }) => [r.source, r.niveau]);
    expect(sources).toContainEqual(["ARS", 3]);
    expect(sources).toContainEqual(["AUTO_EVALUATION", null]);

    const monEtablissement = (await http().get("/verification/mon-etablissement").set("Cookie", await connecter(emails.resp)).expect(200)).body;
    expect(monEtablissement.evaluationsExternes[0].niveau).toBe(3);
    expect(monEtablissement.autoEvaluation.niveau).toBeNull();

    await http().get("/verification/etablissements?q=a").expect(400);
  });
});
