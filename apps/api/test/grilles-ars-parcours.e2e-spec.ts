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

// ROADMAP_GRILLES_ARS.md, étapes 6.1 et 8 — parcours complet sur les 6 grilles
// officielles ARS publiées (aucune grille de test) : liste des grilles,
// démarrage, position de reprise, réponses Présent / Absent / Observations,
// soumission, score, résultats et rapport PDF.
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
  categorie: string;
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
  { type: TypeEtablissement.EH, fichier: "eh-fondamental.json" as const, criteres: 94 },
  { type: TypeEtablissement.EH, fichier: "eh-avance.json" as const, criteres: 15 },
  { type: TypeEtablissement.ESPC, fichier: "espc.json" as const, criteres: 30 },
  { type: TypeEtablissement.ESPC, fichier: "espc-fondamental.json" as const, criteres: 78 },
  { type: TypeEtablissement.ESPC, fichier: "espc-avance.json" as const, criteres: 17 },
];
const TYPES = [TypeEtablissement.EH, TypeEtablissement.ESPC];

// Règle des manuels ARS § 2.2, réécrite ici indépendamment de scoring.util.ts.
function scoreAttendu(categorie: string, presents: number, evalues: number): number {
  if (categorie === "Essentiel") return presents === evalues ? 1 : 0;
  const pct = (presents / evalues) * 100;
  return pct >= 80 ? 1 : pct >= 30 ? 0.5 : 0;
}

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

    for (const type of TYPES) {
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

  describe.each(CAS)("grille $type $fichier", ({ type, fichier, criteres: nombreCriteres }) => {
    const nomOfficiel = lireGrilleArs(fichier).nom;
    let grille: GrilleApi;
    let sessionId: string;
    let attendus: {
      codeAbsent: string;
      libelleAbsent: string;
      codeSansReponse: string;
      codeObserve: string;
      enEcart: string[];
      score: number;
    };

    it("l'établissement voit la grille officielle publiée de son type, une seule version, avec sa structure complète", async () => {
      const cookie = await connecter(emails[type]);
      const liste = await request(app.getHttpServer()).get(`/grilles?type=${type}`).set("Cookie", cookie).expect(200);
      const versions = liste.body.filter((g: { nom: string }) => g.nom === nomOfficiel);
      expect(versions).toHaveLength(1);
      const resume = versions[0];
      const derniere = await prisma.grille.findFirstOrThrow({ where: { nom: nomOfficiel }, orderBy: { version: "desc" } });
      expect(resume).toMatchObject({ type, statut: StatutGrille.PUBLIEE, version: derniere.version });
      for (const g of liste.body) expect(g.statut).toBe(StatutGrille.PUBLIEE);
      expect(liste.body.map((g: { nom: string }) => g.nom)).not.toContain(`Grille ${type} — placeholder`);

      grille = (await request(app.getHttpServer()).get(`/grilles/${resume.id}`).set("Cookie", cookie).expect(200)).body;
      const criteres = grille.domaines.flatMap((d) => d.normes.flatMap((n) => n.criteres));
      expect(criteres).toHaveLength(nombreCriteres);
    });

    it("refuse de démarrer une session sur la grille de l'autre type d'établissement", async () => {
      const autre = CAS.find((c) => c.type !== type)!;
      const autreGrille = await prisma.grille.findFirstOrThrow({
        where: { nom: lireGrilleArs(autre.fichier).nom, statut: StatutGrille.PUBLIEE },
      });
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

        // Reprise exacte : la position enregistrée est renvoyée avec la session.
        const nombreQuestions = grille.domaines.flatMap((d) => d.normes.flatMap((n) => n.criteres.flatMap((c) => c.elementsMesurables))).length;
        await request(app.getHttpServer()).put(`/sessions-evaluation/${sessionId}/position`).set("Cookie", cookie).send({ position: 7 }).expect(200);
        const reprise = await request(app.getHttpServer()).get(`/sessions-evaluation/${sessionId}`).set("Cookie", cookie).expect(200);
        expect(reprise.body.positionQuestion).toBe(7);
        await request(app.getHttpServer())
          .put(`/sessions-evaluation/${sessionId}/position`)
          .set("Cookie", cookie)
          .send({ position: nombreQuestions + 1 })
          .expect(400);
        // Seules les valeurs Présent / Absent / Observations sont acceptées.
        const premier = grille.domaines[0].normes[0].criteres[0].elementsMesurables[0];
        for (const valeur of [true, "OUI", ""]) {
          await request(app.getHttpServer())
            .put(`/sessions-evaluation/${sessionId}/reponses/${premier.id}`)
            .set("Cookie", cookie)
            .send({ valeur })
            .expect(400);
        }

        const criteres = grille.domaines.flatMap((d) => d.normes.flatMap((n) => n.criteres));
        const docsDe = (c: CritereApi) => c.elementsMesurables.filter((e) => e.entreDansScore);
        const documents = criteres.flatMap((c) => docsDe(c).map((e) => ({ critere: c, element: e })));
        // Document au libellé le plus long → « Absent » (teste aussi les textes longs).
        const plusLong = documents.reduce((a, b) => (b.element.libelle.length > a.element.libelle.length ? b : a));
        // 1er document du dernier critère → laissé sans réponse.
        const dernier = criteres[criteres.length - 1];
        const sansReponse = docsDe(dernier)[0];
        // 1er autre critère → tous ses documents à « Observations » : non calculé.
        const observe = criteres.find((c) => c.code !== plusLong.critere.code && c.code !== dernier.code)!;

        // Score attendu : chaque critère noté selon sa catégorie ; le critère observé est exclu.
        let total = 0;
        const enEcart: string[] = [];
        for (const c of criteres) {
          if (c.code === observe.code) continue;
          const evalues = docsDe(c).length;
          const absents = docsDe(c).filter((e) => e.id === plusLong.element.id || e.id === sansReponse.id).length;
          const score = scoreAttendu(c.categorie, evalues - absents, evalues);
          total += score;
          if (score < 1) enEcart.push(c.code);
        }
        attendus = {
          codeAbsent: plusLong.critere.code,
          libelleAbsent: plusLong.element.libelle,
          codeSansReponse: dernier.code,
          codeObserve: observe.code,
          enEcart: enEcart.sort(),
          score: Math.round((total / (nombreCriteres - 1)) * 10000) / 100,
        };

        const reponses: { id: string; valeur: string; commentaire?: string }[] = documents
          .filter((d) => d.element.id !== sansReponse.id)
          .map((d) =>
            d.critere.code === observe.code
              ? { id: d.element.id, valeur: "OBSERVATION", commentaire: `Observation de test ${d.element.id}` }
              : { id: d.element.id, valeur: d.element.id === plusLong.element.id ? "ABSENT" : "PRESENT" },
          );
        // Entretiens et observations à « Absent » dans un critère par ailleurs complet : sans effet sur le score.
        // Un texte envoyé avec « Absent » n'est pas conservé.
        const complet = criteres.find(
          (c) => ![plusLong.critere.code, dernier.code, observe.code].includes(c.code) && c.elementsMesurables.some((e) => !e.entreDansScore),
        )!;
        for (const e of complet.elementsMesurables.filter((x) => !x.entreDansScore)) {
          reponses.push({ id: e.id, valeur: "ABSENT", commentaire: "texte ignoré" });
        }

        for (let i = 0; i < reponses.length; i += 10) {
          await Promise.all(
            reponses.slice(i, i + 10).map((r) =>
              request(app.getHttpServer())
                .put(`/sessions-evaluation/${sessionId}/reponses/${r.id}`)
                .set("Cookie", cookie)
                .send({ valeur: r.valeur, commentaire: r.commentaire })
                .expect(200),
            ),
          );
        }
        expect(await prisma.reponse.count({ where: { sessionId } })).toBe(reponses.length);
        expect(await prisma.reponse.count({ where: { sessionId, commentaire: { not: null } } })).toBe(docsDe(observe).length);

        const soumise = await request(app.getHttpServer()).post(`/sessions-evaluation/${sessionId}/soumettre`).set("Cookie", cookie).expect(201);
        expect(soumise.body.scoreGlobal).toBe(attendus.score);
        // Session soumise : la position n'est plus modifiable.
        await request(app.getHttpServer()).put(`/sessions-evaluation/${sessionId}/position`).set("Cookie", cookie).send({ position: 0 }).expect(409);
      },
      900_000,
    );

    it("résultats : exactement les critères en écart, avec le libellé officiel complet du document", async () => {
      const cookie = await connecter(emails[type]);
      const res = await request(app.getHttpServer()).get(`/sessions-evaluation/${sessionId}/resultats`).set("Cookie", cookie).expect(200);
      expect(res.body.scoreGlobal).toBe(attendus.score);
      const codes = res.body.criteresNonValides.map((c: { code: string }) => c.code).sort();
      expect(codes).toEqual(attendus.enEcart);
      const tousDocs = res.body.criteresNonValides.flatMap((c: { documentsNonValides: unknown[] }) => c.documentsNonValides);
      if (attendus.enEcart.includes(attendus.codeAbsent)) {
        expect(tousDocs).toContainEqual(expect.objectContaining({ libelle: attendus.libelleAbsent, reponse: "ABSENT" }));
      }
      if (attendus.enEcart.includes(attendus.codeSansReponse)) {
        expect(tousDocs).toContainEqual(expect.objectContaining({ reponse: "SANS_REPONSE" }));
      }
      expect(res.body.criteresNonCalcules.map((c: { code: string }) => c.code)).toEqual([attendus.codeObserve]);
      expect(res.body.observations.length).toBeGreaterThan(0);
      for (const o of res.body.observations) {
        expect(o).toMatchObject({ critereCode: attendus.codeObserve, commentaire: `Observation de test ${o.elementMesurableId}` });
      }
      const parDomaine = res.body.parDomaine as { criteresTotal: number; criteresApplicables: number }[];
      expect(parDomaine.reduce((s, d) => s + d.criteresTotal, 0)).toBe(nombreCriteres);
      expect(parDomaine.reduce((s, d) => s + d.criteresApplicables, 0)).toBe(nombreCriteres - 1);
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
        const chemin = join(tmpdir(), `rapport-grille-ars-${fichier.replace(".json", "")}-${suffixe}.pdf`);
        writeFileSync(chemin, contenu);
        console.log(`Rapport ${type} : ${chemin} (${contenu.length} octets)`);
      },
      300_000,
    );
  });
});
