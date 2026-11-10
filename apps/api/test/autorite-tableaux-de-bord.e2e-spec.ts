import { Test, type TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request from "supertest";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { cleRapprochement } from "@dps/shared";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import {
  NiveauAutorite,
  RoleUtilisateur,
  StatutRapportStatistique,
  TypeCompte,
  TypeEtablissement,
  TypeStructure,
} from "../src/generated/prisma/enums.js";

// Tableaux de bord des autorités (ROADMAP_ESPACE_AUTORITES.md, étape 3.5) :
// ressort de chaque niveau, aucun brouillon, cases calculées, filtres.
// Données préfixées par un suffixe aléatoire et nettoyées.
describe("Tableaux de bord des autorités (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const motDePasse = "TestTableaux!2026";
  const suffixe = randomUUID().slice(0, 8);
  const zone = `Zone TdB ${suffixe}`;
  const autreZone = `Autre TdB ${suffixe}`;

  const idsUtilisateurs: string[] = [];
  const idsAutorites: string[] = [];
  const emails: Record<string, string> = {};
  const org: Record<"a" | "b" | "c" | "zou", string> = { a: "", b: "", c: "", zou: "" };
  const resp: Record<string, string> = {};

  const cacheConnexion = new Map<string, string>();
  async function connecter(cle: string): Promise<string> {
    const deja = cacheConnexion.get(cle);
    if (deja) return deja;
    const res = await request(app.getHttpServer()).post("/auth/login").send({ email: emails[cle], motDePasse }).expect(200);
    const cookie = (res.headers["set-cookie"] as unknown as string[]).map((c) => c.split(";")[0]).join("; ");
    cacheConnexion.set(cle, cookie);
    return cookie;
  }

  async function get(cle: string, chemin: string, statut = 200) {
    return request(app.getHttpServer()).get(chemin).set("Cookie", await connecter(cle)).expect(statut);
  }

  async function creerUtilisateur(cle: string, role: RoleUtilisateur, rattachement: { organisationId?: string; autoriteSanitaireId?: string }) {
    const u = await prisma.utilisateur.create({
      data: {
        ...rattachement,
        typeCompte: rattachement.autoriteSanitaireId ? TypeCompte.AUTORITE_SANITAIRE : TypeCompte.ORGANISATION,
        email: `tdb-${cle}-${suffixe}@example.test`,
        motDePasseHash: await bcrypt.hash(motDePasse, 4),
        nom: "Test",
        prenom: cle,
        emailVerifieLe: new Date(),
        roles: { create: { role } },
      },
    });
    emails[cle] = u.email;
    idsUtilisateurs.push(u.id);
    return u.id;
  }

  async function creerAutorite(cle: string, niveau: NiveauAutorite, departement: string | null, zoneSanitaire: string | null) {
    const a = await prisma.autoriteSanitaire.create({
      data: { nom: `Autorité ${cle} ${suffixe}`, niveau, departement, zoneSanitaire, zoneSanitaireCle: zoneSanitaire ? cleRapprochement(zoneSanitaire) : null },
    });
    idsAutorites.push(a.id);
    await creerUtilisateur(cle, RoleUtilisateur.AUTORITE_SANITAIRE, { autoriteSanitaireId: a.id });
  }

  // Rapport PNLP1 : cas testés à la GE de la photo (01 + 37 = 38, 01 + 28 = 29, total 67).
  async function creerRapport(cle: "a" | "b" | "c" | "zou", periode: string, statut: StatutRapportStatistique, zoneRapport: string | null, departement: string, ge = 37) {
    return prisma.rapportStatistique.create({
      data: {
        organisationId: org[cle],
        formulaireCode: "PNLP1",
        formulaireVersion: "PNLP1",
        periode,
        statut,
        entete: { departement, zoneSanitaire: zoneRapport ?? "" },
        valeurs: {
          "indicateurs.s_ge.d5_M": 1,
          "indicateurs.s_ge.d5p_M": ge,
          "indicateurs.s_ge.d5_F": 1,
          "indicateurs.s_ge.d5p_F": 28,
          "indicateurs.s_ge.fe": 0,
          "rupture.cta": true,
        },
        departement,
        zoneSanitaireCle: zoneRapport ? cleRapprochement(zoneRapport) : null,
        creeParId: resp[cle],
        soumisParId: statut === StatutRapportStatistique.BROUILLON ? null : resp[cle],
        soumisLe: statut === StatutRapportStatistique.BROUILLON ? null : new Date(`${periode}-28T10:00:00.000Z`),
        recuLe: statut === StatutRapportStatistique.VALIDE ? new Date(`${periode}-28T12:00:00.000Z`) : null,
        valideLe: statut === StatutRapportStatistique.VALIDE ? new Date(`${periode}-28T18:00:00.000Z`) : null,
      },
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    const creer = async (cle: keyof typeof org, departement: string, zoneSanitaire: string | null, commune: string, typeStructure: TypeStructure) => {
      const o = await prisma.organisation.create({
        data: { nom: `TdB ${cle} ${suffixe}`, ifu: `tdb-${cle}-${suffixe}`, type: TypeEtablissement.ESPC, departement, zoneSanitaire, commune, typeStructure },
      });
      org[cle] = o.id;
      resp[cle] = await creerUtilisateur(`resp-${cle}`, RoleUtilisateur.RESPONSABLE_COMPTE, { organisationId: o.id });
    };
    // a et b dans la zone (b écrite autrement : casse) ; c dans une autre zone de l'Ouémé ; zou ailleurs.
    await creer("a", "OUEME", zone, "Porto-Novo", TypeStructure.CLINIQUE);
    await creer("b", "OUEME", zone.toUpperCase(), "Sèmè-Podji", TypeStructure.HOPITAL);
    await creer("c", "OUEME", autreZone, "Adjarra", TypeStructure.CLINIQUE);
    await creer("zou", "ZOU", null, "Abomey", TypeStructure.CLINIQUE);

    await creerAutorite("zs", NiveauAutorite.ZONE_SANITAIRE, "OUEME", zone);
    await creerAutorite("ddsOueme", NiveauAutorite.DEPARTEMENT, "OUEME", null);
    await creerAutorite("ddsZou", NiveauAutorite.DEPARTEMENT, "ZOU", null);
    await creerAutorite("national", NiveauAutorite.NATIONAL, null, null);

    await creerRapport("a", "2026-01", StatutRapportStatistique.VALIDE, zone, "OUEME");
    await creerRapport("a", "2026-02", StatutRapportStatistique.SOUMIS, zone, "OUEME", 40);
    await creerRapport("a", "2026-03", StatutRapportStatistique.BROUILLON, zone, "OUEME");
    await creerRapport("b", "2026-01", StatutRapportStatistique.SOUMIS, zone, "OUEME");
    await creerRapport("c", "2026-01", StatutRapportStatistique.SOUMIS, autreZone, "OUEME");
    await creerRapport("zou", "2026-01", StatutRapportStatistique.SOUMIS, null, "ZOU");
  });

  afterAll(async () => {
    const orgs = Object.values(org).filter(Boolean);
    await prisma.rapportStatistique.deleteMany({ where: { organisationId: { in: orgs } } });
    await prisma.journalAudit.deleteMany({ where: { utilisateurId: { in: idsUtilisateurs } } });
    await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: idsUtilisateurs } } });
    await prisma.utilisateur.deleteMany({ where: { id: { in: idsUtilisateurs } } });
    await prisma.autoriteSanitaire.deleteMany({ where: { id: { in: idsAutorites } } });
    await prisma.organisation.deleteMany({ where: { id: { in: orgs } } });
    await app.close();
  });

  const nos = () => [org.a, org.b, org.c, org.zou].join(",");

  it("réservé aux autorités : un compte établissement reçoit 403", async () => {
    for (const chemin of ["/autorite/etablissements", "/autorite/synthese", "/autorite/transmissions?formulaire=PNLP1", "/autorite/donnees?formulaire=PNLP1&cles=rupture.cta"]) {
      await get("resp-a", chemin, 403);
    }
  });

  it("établissements : chaque autorité ne voit que son ressort", async () => {
    const ids = (body: { id: string }[]) => body.map((e) => e.id);
    const zs = (await get("zs", "/autorite/etablissements")).body as { id: string; rapports: { total: number; soumis: number; valides: number } }[];
    expect(ids(zs)).toEqual(expect.arrayContaining([org.a, org.b]));
    expect(ids(zs)).not.toContain(org.c);
    expect(ids(zs)).not.toContain(org.zou);
    // Le brouillon de a n'est pas compté.
    expect(zs.find((e) => e.id === org.a)?.rapports).toEqual({ total: 2, soumis: 1, valides: 1 });

    const dds = ids((await get("ddsOueme", "/autorite/etablissements")).body);
    expect(dds).toEqual(expect.arrayContaining([org.a, org.b, org.c]));
    expect(dds).not.toContain(org.zou);
    const zou = ids((await get("ddsZou", "/autorite/etablissements")).body);
    expect(zou).toContain(org.zou);
    expect(zou).not.toContain(org.a);
    const nat = ids((await get("national", "/autorite/etablissements")).body);
    expect(nat).toEqual(expect.arrayContaining([org.a, org.b, org.c, org.zou]));
  });

  it("synthèse : totaux du ressort, sans brouillon, délais mesurés", async () => {
    const zs = (await get("zs", `/autorite/synthese?organisations=${nos()}`)).body;
    expect(zs.totaux).toMatchObject({ recus: 3, aValider: 2, valides: 1, etablissementsRessort: 2, etablissementsAyantTransmis: 2 });
    expect(zs.parFormulaire.find((f: { code: string }) => f.code === "PNLP1")).toEqual({ code: "PNLP1", recus: 3, aValider: 2, valides: 1 });
    // Soumission → validation : 8 h = 0,3 jour (arrondi au dixième).
    expect(zs.delais.soumissionValidation).toEqual({ n: 1, moyenne: 0.3, mediane: 0.3 });
    expect(zs.aValiderListe.map((r: { organisationId: string }) => r.organisationId).sort()).toEqual([org.a, org.b].sort());

    const dds = (await get("ddsOueme", `/autorite/synthese?organisations=${nos()}`)).body;
    expect(dds.totaux.recus).toBe(4);
    const filtreDate = (await get("zs", `/autorite/synthese?organisations=${nos()}&du=2026-02-01&au=2026-02-28`)).body;
    expect(filtreDate.totaux.recus).toBe(1);
    const filtreCommune = (await get("zs", `/autorite/synthese?organisations=${nos()}&communes=${encodeURIComponent("Sèmè-Podji")}`)).body;
    expect(filtreCommune.totaux).toMatchObject({ recus: 1, etablissementsRessort: 1 });
    const filtreStructure = (await get("zs", `/autorite/synthese?organisations=${nos()}&structures=HOPITAL`)).body;
    expect(filtreStructure.totaux.recus).toBe(1);
    await get("zs", "/autorite/synthese?structures=INCONNU", 400);
    await get("zs", "/autorite/synthese?du=2026-03-01&au=2026-01-01", 400);
    await get("zs", "/autorite/synthese?du=01/01/2026", 400);
  });

  it("transmissions : matrice établissement × période", async () => {
    const t = (await get("zs", `/autorite/transmissions?formulaire=PNLP1&du=2026-01-01&au=2026-03-31&organisations=${nos()}`)).body;
    expect(t.periodes).toEqual(["2026-01", "2026-02", "2026-03"]);
    const a = t.etablissements.find((e: { id: string }) => e.id === org.a);
    expect(a.cellules["2026-01"].statut).toBe("VALIDE");
    expect(a.cellules["2026-02"].statut).toBe("SOUMIS");
    expect(a.cellules["2026-03"]).toBeNull(); // brouillon : non reçu
    expect(t.etablissements.map((e: { id: string }) => e.id)).not.toContain(org.c);
    expect(t.parPeriode).toEqual([
      { periode: "2026-01", transmis: 2, valides: 1, etablissementsLocalises: 2 },
      { periode: "2026-02", transmis: 1, valides: 0, etablissementsLocalises: 2 },
      { periode: "2026-03", transmis: 0, valides: 0, etablissementsLocalises: 2 },
    ]);
    await get("zs", "/autorite/transmissions", 400);
  });

  it("données : cases saisies, calculées et Oui/Non, rapport par rapport", async () => {
    const cles = ["indicateurs.s_ge.d5p_M", "indicateurs.s_ge.st_M", "indicateurs.s_ge.total", "rupture.cta", "rupture.sp"].join(",");
    const d = (await get("zs", `/autorite/donnees?formulaire=PNLP1&cles=${cles}&organisations=${nos()}`)).body;
    expect(d.rapports).toHaveLength(3);
    const fev = d.rapports.find((r: { periode: string }) => r.periode === "2026-02");
    expect(fev.valeurs).toEqual({
      "indicateurs.s_ge.d5p_M": 40,
      "indicateurs.s_ge.st_M": 41,
      "indicateurs.s_ge.total": 70,
      "rupture.cta": true,
      "rupture.sp": null,
    });
    const jan = d.rapports.filter((r: { periode: string }) => r.periode === "2026-01");
    expect(jan.every((r: { valeurs: Record<string, number> }) => r.valeurs["indicateurs.s_ge.total"] === 67)).toBe(true);
    // Statut et établissement filtrés.
    const valides = (await get("zs", `/autorite/donnees?formulaire=PNLP1&cles=rupture.cta&statut=VALIDE&organisations=${nos()}`)).body;
    expect(valides.rapports).toHaveLength(1);
    // Cases refusées : inconnue, hachurée, fusionnée secondaire, texte.
    for (const cle of ["indicateurs.x.y", "indicateurs.s_cta_pharmacie.d5_M", "indicateurs.s_cta_pharmacie.st_F", "signataires.statisticien"]) {
      await get("zs", `/autorite/donnees?formulaire=PNLP1&cles=${cle}`, 400);
    }
    const trop = Array.from({ length: 601 }, (_, i) => `x${i}`).join(",");
    await get("zs", `/autorite/donnees?formulaire=PNLP1&cles=${trop}`, 400);
    await get("zs", "/autorite/donnees?formulaire=PNLP1", 400);
  });
});
