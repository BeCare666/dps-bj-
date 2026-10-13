// Données de test temporaires — ROADMAP_GRILLES_ARS.md, étape 6.4. Supprimé à la fin de l'étape.
// Usage : creer | soumettre | comparer | supprimer
import "dotenv/config";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient, RoleUtilisateur, StatutGrille, TypeCompte, TypeEtablissement } from "../src/generated/prisma/client.js";
import { createTidbAdapter } from "../src/prisma/create-tidb-adapter.js";
import { grilleStructureInclude } from "../src/grilles/grilles.service.js";

const ici = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({ adapter: createTidbAdapter(process.env.DATABASE_URL!, join(ici, "..", "certs", "tidb-ca.pem")) });
const FICHIER = join(ici, "..", ".test-6-4.json"); // identifiants de test (fichier temporaire)
const COMPTES = [
  { cle: "espc", email: "test-6-4-espc@example.test", type: TypeEtablissement.ESPC, ifu: "test-6-4-espc" },
  { cle: "eh", email: "test-6-4-eh@example.test", type: TypeEtablissement.EH, ifu: "test-6-4-eh" },
  { cle: "admin", email: "test-6-4-admin@example.test", type: null, ifu: null },
] as const;
const NOM_ESPC = "Grille d'auto-évaluation des critères essentiels des ESPC";
const action = process.argv[2];

if (action === "creer") {
  const ids: Record<string, string> = {};
  for (const c of COMPTES) {
    const motDePasse = randomBytes(12).toString("base64url") + "!A1";
    const org = c.type ? await prisma.organisation.create({ data: { nom: `[TEST 6.4] ${c.type}`, ifu: c.ifu!, type: c.type } }) : null;
    await prisma.utilisateur.create({
      data: {
        organisationId: org?.id ?? null,
        typeCompte: org ? TypeCompte.ORGANISATION : TypeCompte.ADMIN_PLATEFORME,
        email: c.email, motDePasseHash: await bcrypt.hash(motDePasse, 10), nom: "Test", prenom: `6.4 ${c.cle}`,
        emailVerifieLe: new Date(),
        roles: { create: { role: org ? RoleUtilisateur.RESPONSABLE_COMPTE : RoleUtilisateur.ADMIN_PLATEFORME } },
      },
    });
    ids[c.cle] = motDePasse;
  }
  writeFileSync(FICHIER, JSON.stringify(Object.fromEntries(COMPTES.map((c) => [c.cle, { email: c.email, motDePasse: ids[c.cle] }])), null, 2));
  console.log("3 comptes de test créés ; identifiants dans .test-6-4.json");
} else if (action === "soumettre") {
  // Session ESPC soumise par l'API en marche (même parcours qu'en 6.2) pour contrôler la page Résultats.
  const id = JSON.parse(readFileSync(FICHIER, "utf8")).espc;
  const API = "http://localhost:3001";
  const login = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: id.email, motDePasse: id.motDePasse }) });
  if (login.status !== 200) throw new Error(`login ${login.status}`);
  const h = { Cookie: login.headers.getSetCookie().map((x) => x.split(";")[0]).join("; "), "Content-Type": "application/json" };
  const grille = await prisma.grille.findFirstOrThrow({ where: { nom: NOM_ESPC, version: 1 }, include: grilleStructureInclude });
  const session = await (await fetch(`${API}/sessions-evaluation`, { method: "POST", headers: h, body: JSON.stringify({ grilleId: grille.id }) })).json();
  const criteres = grille.domaines.flatMap((d) => d.normes.flatMap((n) => n.criteres));
  const doc = (code: string, i: number) => criteres.find((c) => c.code === code)!.elementsMesurables.filter((e) => e.entreDansScore)[i];
  const non = new Set([doc("A.1.1.1", 1).id, doc("C.2.1.1", 0).id]);
  const sansReponse = doc("D.1.1.1", 2).id;
  for (const c of criteres) for (const e of c.elementsMesurables.filter((x) => x.entreDansScore)) {
    if (e.id === sansReponse) continue;
    const r = await fetch(`${API}/sessions-evaluation/${session.id}/reponses/${e.id}`, { method: "PUT", headers: h, body: JSON.stringify({ valeur: !non.has(e.id) }) });
    if (r.status !== 200) throw new Error(`réponse ${r.status}`);
  }
  const soumise = await (await fetch(`${API}/sessions-evaluation/${session.id}/soumettre`, { method: "POST", headers: h })).json();
  console.log(JSON.stringify({ sessionId: session.id, score: soumise.scoreGlobal }));
} else if (action === "comparer") {
  // Brouillon v2 créé par l'éditeur admin, comparé à la v1 publiée : rien ne doit être perdu.
  const proj = (g: any) => g.domaines.map((d: any) => [d.nom, d.ordre, d.normes.map((n: any) => [n.code, n.libelle, n.criteres.map((c: any) => [c.code, c.libelle, c.categorie, c.registre, c.recommandation, c.elementsMesurables.map((e: any) => [e.libelle, e.typeElement, e.typeReponse, e.entreDansScore])])])]);
  for (const nom of [NOM_ESPC]) {
    const v1 = await prisma.grille.findFirstOrThrow({ where: { nom, version: 1 }, include: grilleStructureInclude });
    const brouillons = await prisma.grille.findMany({ where: { nom, statut: StatutGrille.BROUILLON }, include: grilleStructureInclude });
    for (const b of brouillons) {
      const a = JSON.stringify(proj(v1)), z = JSON.stringify(proj(b));
      const regs = b.domaines.flatMap((d) => d.normes.flatMap((n) => n.criteres)).filter((c) => c.registre).length;
      console.log(`v${b.version} ${b.statut} maj ${b.updatedAt.toISOString()} | identique à v1 : ${a === z} | registres : ${regs}`);
      if (a !== z) {
        for (let i = 0; i < Math.max(a.length, z.length); i++) if (a[i] !== z[i]) { console.log("1re différence :", a.slice(i - 80, i + 80), "\n   ↳", z.slice(i - 80, i + 80)); break; }
      }
    }
  }
} else if (action === "supprimer") {
  const users = await prisma.utilisateur.findMany({ where: { email: { in: COMPTES.map((c) => c.email) } }, select: { id: true } });
  const uids = users.map((u) => u.id);
  const orgs = (await prisma.organisation.findMany({ where: { ifu: { in: ["test-6-4-espc", "test-6-4-eh"] } }, select: { id: true } })).map((o) => o.id);
  const sids = (await prisma.sessionEvaluation.findMany({ where: { organisationId: { in: orgs } }, select: { id: true } })).map((s) => s.id);
  await prisma.rapportPdf.deleteMany({ where: { sessionId: { in: sids } } });
  await prisma.reponse.deleteMany({ where: { sessionId: { in: sids } } });
  await prisma.sessionEvaluation.deleteMany({ where: { id: { in: sids } } });
  // Brouillons des grilles officielles créés pendant le test (la v1 publiée n'est jamais touchée).
  const brouillons = await prisma.grille.deleteMany({ where: { nom: { in: [NOM_ESPC, "Grille d'auto-évaluation des critères essentiels des EH"] }, statut: StatutGrille.BROUILLON, version: { gt: 1 } } });
  await prisma.notification.deleteMany({ where: { destinataireId: { in: uids } } });
  await prisma.journalAudit.deleteMany({ where: { utilisateurId: { in: uids } } });
  await prisma.refreshToken.deleteMany({ where: { utilisateurId: { in: uids } } });
  await prisma.utilisateur.deleteMany({ where: { id: { in: uids } } });
  await prisma.organisation.deleteMany({ where: { id: { in: orgs } } });
  if (existsSync(FICHIER)) rmSync(FICHIER);
  console.log(`supprimé : ${uids.length} comptes, ${orgs.length} organisations, ${sids.length} sessions, ${brouillons.count} brouillon(s)`);
}
await prisma.$disconnect();
