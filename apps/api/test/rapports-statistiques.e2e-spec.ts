import { Test, type TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request from "supertest";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { cleRapprochement, formulaireStatistique, saisiesFormulaire } from "@dps/shared";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { NiveauAutorite, RoleUtilisateur, TypeCompte, TypeEtablissement } from "../src/generated/prisma/enums.js";

// Rapports statistiques (ROADMAP_RAPPORTS_STATISTIQUES.md, étapes 2 à 6) :
// saisie par le responsable du compte, soumission, ressort et validation des
// autorités sanitaires. Données préfixées par un suffixe aléatoire et nettoyées.
// Délai porté à 120 s : un test peut attendre la fin de la fenêtre de 60 s de /auth/login.
describe("Rapports statistiques (e2e)", { timeout: 120_000 }, () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const motDePasse = "TestRapports!2026";
  const suffixe = randomUUID().slice(0, 8);
  const zone = `Zone Éssai ${suffixe}`;

  const idsUtilisateurs: string[] = [];
  const idsOrganisations: string[] = [];
  const idsAutorites: string[] = [];
  const emails: Record<string, string> = {};
  const cacheConnexion = new Map<string, string>();

  async function connecter(cle: string): Promise<string> {
    const email = emails[cle];
    const deja = cacheConnexion.get(email);
    if (deja) return deja;
    // Ce fichier connecte 7 comptes : au-delà de 5 connexions en 60 s, la limite
    // D9 de /auth/login (inchangée) répond 429. On attend alors la fin de la
    // fenêtre (en-tête Retry-After, en secondes) avant de réessayer une fois.
    let res = await request(app.getHttpServer()).post("/auth/login").send({ email, motDePasse });
    if (res.status === 429) {
      const secondes = Number(res.headers["retry-after"]) || 60;
      await new Promise((r) => setTimeout(r, (secondes + 1) * 1000));
      res = await request(app.getHttpServer()).post("/auth/login").send({ email, motDePasse });
    }
    expect(res.status).toBe(200);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    const cookie = cookies.map((c) => c.split(";")[0]).join("; ");
    cacheConnexion.set(email, cookie);
    return cookie;
  }

  async function creerUtilisateur(
    cle: string,
    role: RoleUtilisateur,
    rattachement: { organisationId?: string; autoriteSanitaireId?: string },
  ) {
    const u = await prisma.utilisateur.create({
      data: {
        ...rattachement,
        typeCompte: rattachement.autoriteSanitaireId ? TypeCompte.AUTORITE_SANITAIRE : TypeCompte.ORGANISATION,
        email: `rs-${cle}-${suffixe}@example.test`,
        motDePasseHash: await bcrypt.hash(motDePasse, 4),
        nom: "Test",
        prenom: cle,
        emailVerifieLe: new Date(),
        roles: { create: { role } },
      },
    });
    emails[cle] = u.email;
    idsUtilisateurs.push(u.id);
  }

  async function creerAutorite(cle: string, niveau: NiveauAutorite, departement: string | null, zoneSanitaire: string | null) {
    const a = await prisma.autoriteSanitaire.create({
      data: {
        nom: `Autorité ${cle} ${suffixe}`,
        niveau,
        departement,
        zoneSanitaire,
        zoneSanitaireCle: zoneSanitaire ? cleRapprochement(zoneSanitaire) : null,
      },
    });
    idsAutorites.push(a.id);
    await creerUtilisateur(cle, RoleUtilisateur.AUTORITE_SANITAIRE, { autoriteSanitaireId: a.id });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    const orgA = await prisma.organisation.create({
      data: {
        nom: `Clinique RS A ${suffixe}`,
        ifu: `rs-a-${suffixe}`,
        type: TypeEtablissement.ESPC,
        departement: "OUEME",
        commune: "Porto-Novo",
        zoneSanitaire: zone,
      },
    });
    const orgB = await prisma.organisation.create({
      data: { nom: `Clinique RS B ${suffixe}`, ifu: `rs-b-${suffixe}`, type: TypeEtablissement.ESPC, departement: "ZOU" },
    });
    idsOrganisations.push(orgA.id, orgB.id);

    await creerUtilisateur("respA", RoleUtilisateur.RESPONSABLE_COMPTE, { organisationId: orgA.id });
    await creerUtilisateur("qualiteA", RoleUtilisateur.RESP_QUALITE, { organisationId: orgA.id });
    await creerUtilisateur("respB", RoleUtilisateur.RESPONSABLE_COMPTE, { organisationId: orgB.id });

    // Même zone écrite autrement (casse, accents) : le rapprochement doit l'accepter.
    await creerAutorite("zs", NiveauAutorite.ZONE_SANITAIRE, "OUEME", zone.toUpperCase().replace("É", "E"));
    await creerAutorite("zsAutre", NiveauAutorite.ZONE_SANITAIRE, "OUEME", `Autre zone ${suffixe}`);
    await creerAutorite("ddsOueme", NiveauAutorite.DEPARTEMENT, "OUEME", null);
    await creerAutorite("ddsZou", NiveauAutorite.DEPARTEMENT, "ZOU", null);
  });

  afterAll(async () => {
    await prisma.rapportStatistique.deleteMany({ where: { organisationId: { in: idsOrganisations } } });
    await prisma.journalAudit.deleteMany({ where: { utilisateurId: { in: idsUtilisateurs } } });
    await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: idsUtilisateurs } } });
    await prisma.utilisateur.deleteMany({ where: { id: { in: idsUtilisateurs } } });
    await prisma.autoriteSanitaire.deleteMany({ where: { id: { in: idsAutorites } } });
    await prisma.organisation.deleteMany({ where: { id: { in: idsOrganisations } } });
    await app.close();
  });

  let rapportId: string;

  it("non authentifié → 401 ; responsable qualité → 403 (seul le responsable du compte saisit)", async () => {
    await request(app.getHttpServer()).get("/rapports-statistiques").expect(401);
    const cookie = await connecter("qualiteA");
    await request(app.getHttpServer())
      .post("/rapports-statistiques")
      .set("Cookie", cookie)
      .send({ formulaireCode: "PNLP1", periode: "2026-04" })
      .expect(403);
  });

  it("création : en-tête pré-rempli depuis la fiche de l'établissement", async () => {
    const cookie = await connecter("respA");
    const res = await request(app.getHttpServer())
      .post("/rapports-statistiques")
      .set("Cookie", cookie)
      .send({ formulaireCode: "PNLP1", periode: "2026-04" })
      .expect(201);
    rapportId = res.body.id;
    expect(res.body.statut).toBe("BROUILLON");
    expect(res.body.formulaireVersion).toBe("PNLP1");
    expect(res.body.entete).toEqual({
      departement: "OUEME",
      zoneSanitaire: zone,
      commune: "Porto-Novo",
      arrondissement: "",
      formationSanitaire: `Clinique RS A ${suffixe}`,
    });
  });

  it("refuse un doublon, une période future et une période au mauvais format", async () => {
    const cookie = await connecter("respA");
    const post = (body: object) => request(app.getHttpServer()).post("/rapports-statistiques").set("Cookie", cookie).send(body);
    await post({ formulaireCode: "PNLP1", periode: "2026-04" }).expect(409);
    await post({ formulaireCode: "PNLP1", periode: "2099-01" }).expect(400);
    await post({ formulaireCode: "PNLP1", periode: "2026-S11" }).expect(400);
    await post({ formulaireCode: "INCONNU", periode: "2026-04" }).expect(400);
  });

  it("enregistrement : refuse une case calculée ou hachurée, accepte une saisie partielle", async () => {
    const cookie = await connecter("respA");
    const patch = (body: object) => request(app.getHttpServer()).patch(`/rapports-statistiques/${rapportId}`).set("Cookie", cookie).send(body);
    await patch({ valeurs: { "indicateurs.s_ge.total": 5 } }).expect(400);
    await patch({ valeurs: { "indicateurs.s_cta_pharmacie.d5_M": 5 } }).expect(400);
    await patch({ entete: { inconnu: "x" } }).expect(400);
    const res = await patch({ entete: { arrondissement: "2ème" }, valeurs: { "indicateurs.s_ge.d5p_M": 37 } }).expect(200);
    expect(res.body.valeurs).toEqual({ "indicateurs.s_ge.d5p_M": 37 });
    expect(res.body.entete.arrondissement).toBe("2ème");
  });

  it("soumission refusée tant que des cases sont vides", async () => {
    const cookie = await connecter("respA");
    const res = await request(app.getHttpServer())
      .post(`/rapports-statistiques/${rapportId}/soumettre`)
      .set("Cookie", cookie)
      .expect(400);
    expect(res.body.message).toMatch(/case\(s\) à remplir/);
  });

  it("un brouillon n'est pas visible par la zone sanitaire", async () => {
    const cookie = await connecter("zs");
    await request(app.getHttpServer()).get(`/autorite/rapports/${rapportId}`).set("Cookie", cookie).expect(404);
  });

  it("soumission complète puis verrouillage", async () => {
    const cookie = await connecter("respA");
    const valeurs: Record<string, number | boolean> = {};
    for (const s of saisiesFormulaire(formulaireStatistique("PNLP1")!)) {
      if (s.nature === "entier") valeurs[s.cle] = 0;
      if (s.nature === "oui_non") valeurs[s.cle] = false;
    }
    await request(app.getHttpServer()).patch(`/rapports-statistiques/${rapportId}`).set("Cookie", cookie).send({ valeurs }).expect(200);
    const res = await request(app.getHttpServer())
      .post(`/rapports-statistiques/${rapportId}/soumettre`)
      .set("Cookie", cookie)
      .expect(201);
    expect(res.body.statut).toBe("SOUMIS");
    expect(res.body.soumisPar.prenom).toBe("respA");
    expect(res.body.soumisLe).toBeTruthy();

    await request(app.getHttpServer())
      .patch(`/rapports-statistiques/${rapportId}`)
      .set("Cookie", cookie)
      .send({ valeurs: { "indicateurs.s_ge.d5p_M": 1 } })
      .expect(403);
    await request(app.getHttpServer()).post(`/rapports-statistiques/${rapportId}/soumettre`).set("Cookie", cookie).expect(409);
  });

  it("isolation : un autre établissement ne voit pas le rapport", async () => {
    const cookie = await connecter("respB");
    await request(app.getHttpServer()).get(`/rapports-statistiques/${rapportId}`).set("Cookie", cookie).expect(404);
    const liste = await request(app.getHttpServer()).get("/rapports-statistiques").set("Cookie", cookie).expect(200);
    expect(liste.body).toEqual([]);
  });

  it("un compte établissement n'accède pas à l'espace autorité", async () => {
    const cookie = await connecter("respA");
    await request(app.getHttpServer()).get("/autorite/rapports").set("Cookie", cookie).expect(403);
  });

  it("zone sanitaire destinataire : liste, réception à la première consultation, validation", async () => {
    const cookie = await connecter("zs");
    const liste = await request(app.getHttpServer()).get("/autorite/rapports").set("Cookie", cookie).expect(200);
    expect(liste.body.map((r: { id: string }) => r.id)).toContain(rapportId);

    const vu = await request(app.getHttpServer()).get(`/autorite/rapports/${rapportId}`).set("Cookie", cookie).expect(200);
    expect(vu.body.recuLe).toBeTruthy();
    expect(vu.body.valeurs["indicateurs.s_ge.d5p_M"]).toBe(0);

    const valide = await request(app.getHttpServer())
      .post(`/autorite/rapports/${rapportId}/valider`)
      .set("Cookie", cookie)
      .expect(201);
    expect(valide.body.statut).toBe("VALIDE");
    expect(valide.body.validePar.prenom).toBe("zs");
    await request(app.getHttpServer()).post(`/autorite/rapports/${rapportId}/valider`).set("Cookie", cookie).expect(409);
    // 5 requêtes vers la base distante : plus que les 30 s par défaut.
  }, 120_000);

  it("autre zone sanitaire et autre département : hors ressort", async () => {
    for (const cle of ["zsAutre", "ddsZou"]) {
      const cookie = await connecter(cle);
      const liste = await request(app.getHttpServer()).get("/autorite/rapports").set("Cookie", cookie).expect(200);
      expect(liste.body.map((r: { id: string }) => r.id)).not.toContain(rapportId);
      await request(app.getHttpServer()).get(`/autorite/rapports/${rapportId}`).set("Cookie", cookie).expect(404);
    }
  });

  it("direction départementale : voit le rapport de son département, sans pouvoir le valider", async () => {
    const cookie = await connecter("ddsOueme");
    const vu = await request(app.getHttpServer()).get(`/autorite/rapports/${rapportId}`).set("Cookie", cookie).expect(200);
    expect(vu.body.organisation.nom).toBe(`Clinique RS A ${suffixe}`);
    await request(app.getHttpServer()).post(`/autorite/rapports/${rapportId}/valider`).set("Cookie", cookie).expect(403);
    const moi = await request(app.getHttpServer()).get("/autorite/me").set("Cookie", cookie).expect(200);
    expect(moi.body.niveau).toBe("DEPARTEMENT");
    expect(moi.body.departementLibelle).toBe("Ouémé");
  });

  it("rapport hebdomadaire : période en semaine ISO", async () => {
    const cookie = await connecter("respA");
    const res = await request(app.getHttpServer())
      .post("/rapports-statistiques")
      .set("Cookie", cookie)
      .send({ formulaireCode: "SIMR_HEBDO", periode: "2026-S11" })
      .expect(201);
    expect(res.body.entete).toEqual({
      departement: "OUEME",
      zoneSanitaire: zone,
      commune: "Porto-Novo",
      formationSanitaire: `Clinique RS A ${suffixe}`,
    });
  });

  it("fiche établissement : localisation modifiable, département contrôlé", async () => {
    const cookie = await connecter("respB");
    await request(app.getHttpServer()).patch("/organisations/me").set("Cookie", cookie).send({ departement: "Zou" }).expect(400);
    const res = await request(app.getHttpServer())
      .patch("/organisations/me")
      .set("Cookie", cookie)
      .send({ departement: "ZOU", commune: "Abomey", zoneSanitaire: "Abomey-Djidja-Agbangnizoun" })
      .expect(200);
    expect(res.body.zoneSanitaire).toBe("Abomey-Djidja-Agbangnizoun");
  });
});
