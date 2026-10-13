// Pré-compilation des pages admin (next dev compile à la demande) avec le compte admin de test.
import { readFileSync } from "node:fs";
const id = JSON.parse(readFileSync(".test-6-4.json", "utf8")).admin;
const login = await fetch("http://localhost:3001/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: id.email, motDePasse: id.motDePasse }) });
const cookie = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const grilles = await (await fetch("http://localhost:3001/grilles", { headers: { Cookie: cookie } })).json();
const espc = grilles.find((g) => g.nom === "Grille d'auto-évaluation des critères essentiels des ESPC" && g.version === 1);
for (const chemin of ["/admin/grilles", `/admin/grilles/${espc.id}`]) {
  const t = Date.now(); const r = await fetch(`http://localhost:3002${chemin}`, { headers: { Cookie: cookie }, redirect: "manual" });
  console.log(chemin, r.status, Math.round((Date.now() - t) / 1000) + " s");
}
