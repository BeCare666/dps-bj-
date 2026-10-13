import { Test, type TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request from "supertest";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { MailerService } from "../src/notifications/mailer.service.js";
import { RapportsPdfService } from "../src/sessions-evaluation/rapports-pdf.service.js";
import { RoleUtilisateur, StatutGrille, TypeCompte, TypeEtablissement } from "../src/generated/prisma/enums.js";
import { lireGrilleArs } from "../prisma/grilles-ars/importer.js";

// ROADMAP_GRILLES_ARS.md, étape 6.1 — parcours complet sur les grilles
// officielles ARS publiées (aucune grille de test) : liste des grilles,
// démarrage, réponses, soumission, score, résultats et rapport PDF.
// Les grilles officielles ne sont jamais modifiées par ce test.

interface ElementApi {
  id: string;
  libelle: string;
  typeElement: string;
  entreDansScore: boolean;
}
interface CritereApi {
  id: string;
  code: string;
  registre: string | null;
  elementsMesurables: ElementApi[];
}
interface GrilleApi {
  id: string;
  nom: string;
  type: string;
  statut: string;
  domaines: { normes: { criteres: CritereApi[] }[] }[];
}

const CAS = [
  { type: TypeEtablissement.EH, fichier: "eh.json" as const, criteres: 25 },
  { type: TypeEtablissement.ESPC, fichier: "espc.json" as const, criteres: 30 },
];

describe("Grilles officielles ARS — parcours complet (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rapports: RapportsPdfService;

  const motDePasse = "TestGrillesArs!2026";
  const suffixe = randomUUID().slice(0, 8);
  const idsOrganisations: string[] = [];
  const idsUtilisateurs: string[] = [];
  const emails: Record<string, string> = {};

  const cache = new Map<string, string>();
  async function connecter(email: string): Promise<string> {
    if (cache.has(email)) return cache.get(email)!;
    const res = await request(app.getHttpServer()).post("/auth/login").send({ email, motDePasse }).expect(200);
    const cookie = (res.headers["set-cookie"] as unknown as string[]).map((c) => c.split(";")[0]).join("; ");
    cache.set(email, cookie);
    return cookie;
  }

  beforeAll(async () => {
    const mailerFactice = {
      sendRapportDisponible: vi.fn(),
      sendAlerteEiGraviteElevee: vi.fn(),
      sendAlerteNewsEmail: vi.fn(),
      sendInvitationEmail: vi.fn(),
      sendVerificationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      sendNotificationGenerique: vi.fn(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailerService)
      .useValue(mailerFactice)
      .compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = moduleFixture.get(PrismaService);
    rapports = moduleFixture.get(RapportsPdfService);

    for (const { type } of CAS) {
      const org = await prisma.organisation.create({
        data: { nom: `Grilles ARS ${type} ${suffixe}`, ifu: `gars-${type}-${suffixe}`, type },
      });
      idsOrganisations.push(org.id);
      emails[type] = `grilles-ars-${type.toLowerCase()}-${suffixe}@example.test`;
      const u = await prisma.utilisateur.create({
        data: {
          organisationId: org.id,
          typeCompte: TypeCompte.ORGANISATION,
          email: emails[type],
          motDePasseHash: await bcrypt.hash(motDePasse, 4),
          nom: "Test",
          prenom: "Grilles ARS",
          emailVerifieLe: new Date(),
          roles: { create: { role: RoleUtilisateur.RESPONSABLE_COMPTE } },
        },
      });
      idsUtilisateurs.push(u.id);
    }
  });

  afterAll(async () => {
    const sessions = await prisma.sessionEvaluation.findMany({ where: { organisationId: { in: idsOrganisations } }, select: { id: true } });
    const ids = sessions.map((s) => s.id);
    await prisma.rapportPdf.deleteMany({ where: { sessionId: { in: ids } } });
    await prisma.reponse.deleteMany({ where: { sessionId: { in: ids } } });
    await prisma.sessionEvaluation.deleteMany({ where: { id: { in: ids } } });
    await prisma.notification.deleteMany({ where: { destinataireId: { in: idsUtilisateurs } } });
    await prisma.journalAudit.deleteMany({ where: { utilisateurId: { in: idsUtilisateurs } } });
    await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: idsUtilisateurs } } });
    await prisma.utilisateur.deleteMany({ where: { id: { in: idsUtilisateurs } } });
    await prisma.organisation.deleteMany({ where: { id: { in: idsOrganisations } } });
    await app.close();
  });

  describe.each(CAS)("grille $type", ({ type, fichier, criteres: nombreCriteres }) => {
    const nomOfficiel = lireGrilleArs(fichier).nom;
    let grille: GrilleApi;
    let sessionId: string;
    let attendus: { codeNon: string; libelleNon: string; codeSansReponse: string; score: number };

    it("l'établissement voit la grille officielle publiée de son type, avec sa structure complète", async () => {
      const cookie = await connecter(emails[type]);
      const liste = await request(app.getHttpServer()).get(`/grilles?type=${type}`).set("Cookie", cookie).expect(200);
      const resume = liste.body.find((g: { nom: string }) => g.nom === nomOfficiel);
      expect(resume).toMatchObject({ type, statut: StatutGrille.PUBLIEE, version: 1 });
      for (const g of liste.body) expect(g.statut).toBe(StatutGrille.PUBLIEE);
      expect(liste.body.map((g: { nom: string }) => g.nom)).not.toContain(`Grille ${type} — placeholder`);

      grille = (await request(app.getHttpServer()).get(`/grilles/${resume.id}`).set("Cookie", cookie).expect(200)).body;
      const criteres = grille.domaines.flatMap((d) => d.normes.flatMap((n) => n.criteres));
      expect(criteres).toHaveLength(nombreCriteres);
      if (type === TypeEtablissement.ESPC) for (const c of criteres) expect(c.registre).toMatch(/^Registre /);
    });

    it("refuse de démarrer une session sur la grille de l'autre type d'établissement", async () => {
      const autre = CAS.find((c) => c.type !== type)!;
      const autreGrille = await prisma.grille.findFirstOrThrow({ where: { nom: lireGrilleArs(autre.fichier).nom } });
      await request(app.getHttpServer())
        .post("/sessions-evaluation")
        .set("Cookie", await connecter(emails[type]))
        .send({ grilleId: autreGrille.id })
        .expect(400);
    });

    it(
      "démarre, répond et soumet : le score suit la règle des documents à examiner",
      async () => {
        const cookie = await connecter(emails[type]);
        sessionId = (await request(app.getHttpServer()).post("/sessions-evaluation").set("Cookie", cookie).send({ grilleId: grille.id }).expect(201)).body.id;

        const criteres = grille.domaines.flatMap((d) => d.normes.flatMap((n) => n.criteres));
        const documents = criteres.flatMap((c) => c.elementsMesurables.filter((e) => e.entreDansScore).map((e) => ({ critere: c, element: e })));
        // Document au libellé le plus long → « Non » (teste aussi les textes longs).
        const plusLong = documents.reduce((a, b) => (b.element.libelle.length > a.element.libelle.length ? b : a));
        // 1er document du dernier critère → laissé sans réponse.
        const dernier = criteres[criteres.length - 1];
        const sansReponse = dernier.elementsMesurables.find((e) => e.entreDansScore)!;
        const enEcart = new Set([plusLong.critere.code, dernier.code]);
        attendus = {
          codeNon: plusLong.critere.code,
          libelleNon: plusLong.element.libelle,
          codeSansReponse: dernier.code,
          score: Math.round(((nombreCriteres - enEcart.size) / nombreCriteres) * 10000) / 100,
        };

        const reponses: { id: string; valeur: boolean }[] = documents
          .filter((d) => d.element.id !== sansReponse.id)
          .map((d) => ({ id: d.element.id, valeur: d.element.id !== plusLong.element.id }));
        // Entretiens et observations à « Non » dans un critère par ailleurs complet : sans effet sur le score.
        const complet = criteres.find((c) => !enEcart.has(c.code) && c.elementsMesurables.some((e) => !e.entreDansScore))!;
        for (const e of complet.elementsMesurables.filter((x) => !x.entreDansScore)) reponses.push({ id: e.id, valeur: false });

        for (let i = 0; i < reponses.length; i += 5) {
          await Promise.all(
            reponses.slice(i, i + 5).map((r) =>
              request(app.getHttpServer())
                .put(`/sessions-evaluation/${sessionId}/reponses/${r.id}`)
                .set("Cookie", cookie)
                .send({ valeur: r.valeur })
                .expect(200),
            ),
          );
        }
        expect(await prisma.reponse.count({ where: { sessionId } })).toBe(reponses.length);

        const soumise = await request(app.getHttpServer()).post(`/sessions-evaluation/${sessionId}/soumettre`).set("Cookie", cookie).expect(201);
        expect(soumise.body.scoreGlobal).toBe(attendus.score);
      },
      600_000,
    );

    it("résultats : exactement les critères en écart, avec le libellé officiel complet du document", async () => {
      const cookie = await connecter(emails[type]);
      const res = await request(app.getHttpServer()).get(`/sessions-evaluation/${sessionId}/resultats`).set("Cookie", cookie).expect(200);
      expect(res.body.scoreGlobal).toBe(attendus.score);
      const codes = res.body.criteresNonValides.map((c: { code: string }) => c.code).sort();
      expect(codes).toEqual([...new Set([attendus.codeNon, attendus.codeSansReponse])].sort());
      const tousDocs = res.body.criteresNonValides.flatMap((c: { documentsNonValides: unknown[] }) => c.documentsNonValides);
      expect(tousDocs).toContainEqual(expect.objectContaining({ libelle: attendus.libelleNon, reponse: "NON" }));
      expect(tousDocs).toContainEqual(expect.objectContaining({ reponse: "SANS_REPONSE" }));
      const parDomaine = res.body.parDomaine as { criteresTotal: number }[];
      expect(parDomaine.reduce((s, d) => s + d.criteresTotal, 0)).toBe(nombreCriteres);
    });

    it(
      "rapport PDF généré par la file et téléchargeable",
      async () => {
        const cookie = await connecter(emails[type]);
        // La tâche planifiée (toutes les 30 s) traite aussi la file : si elle est
        // déjà en train de générer ce rapport, traiterFile() rend la main sans
        // rien faire. On attend donc la fin, comme le ferait l'interface.
        let statut = "EN_COURS";
        for (let essai = 0; essai < 36 && statut === "EN_COURS"; essai++) {
          await rapports.traiterFile();
          statut = (await request(app.getHttpServer()).get(`/sessions-evaluation/${sessionId}/rapport`).set("Cookie", cookie).expect(200)).body.statut;
          if (statut === "EN_COURS") await new Promise((r) => setTimeout(r, 5_000));
        }
        expect(statut).toBe("DISPONIBLE");
        const pdf = await request(app.getHttpServer())
          .get(`/sessions-evaluation/${sessionId}/rapport.pdf`)
          .set("Cookie", cookie)
          .buffer(true)
          .parse((res, callback) => {
            const morceaux: Buffer[] = [];
            res.on("data", (m: Buffer) => morceaux.push(m));
            res.on("end", () => callback(null, Buffer.concat(morceaux)));
          })
          .expect(200);
        const contenu = pdf.body as Buffer;
        expect(contenu.subarray(0, 5).toString()).toBe("%PDF-");
        // Copie pour contrôle visuel (ROADMAP_GRILLES_ARS.md, 6.1).
        const chemin = join(tmpdir(), `rapport-grille-ars-${type}-${suffixe}.pdf`);
        writeFileSync(chemin, contenu);
        console.log(`Rapport ${type} : ${chemin} (${contenu.length} octets)`);
      },
      300_000,
    );
  });
});
