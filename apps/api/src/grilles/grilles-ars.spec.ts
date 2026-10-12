import "reflect-metadata";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateGrilleDto } from "./dto/create-grille.dto.js";
import { calculerScore } from "../sessions-evaluation/scoring.util.js";
import { TypeReponse } from "../generated/prisma/enums.js";

// Grilles officielles ARS (prisma/grilles-ars/), importées par le seed. Les
// effectifs attendus sont ceux annoncés par les manuels ARS : 25 critères
// essentiels pour les EH, 30 pour les ESPC.

interface Element {
  libelle: string;
  typeElement: string;
  typeReponse: string;
  entreDansScore: boolean;
  ordre: number;
}
interface Critere {
  code: string;
  libelle: string;
  categorie: string;
  registre: string | null;
  ordre: number;
  elementsMesurables: Element[];
}
interface Grille {
  _source: string;
  nom: string;
  type: string;
  domaines: { nom: string; ordre: number; normes: { code: string; libelle: string; ordre: number; criteres: Critere[] }[] }[];
}

const dossier = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "prisma", "grilles-ars");
const lire = (fichier: string) => JSON.parse(readFileSync(join(dossier, fichier), "utf8")) as Grille;

const CAS = [
  { fichier: "eh.json", type: "EH", criteres: 25, domaines: ["A", "B", "C", "D", "E"] },
  { fichier: "espc.json", type: "ESPC", criteres: 30, domaines: ["A", "B", "C", "D", "E"] },
];

function criteres(grille: Grille): { domaine: string; norme: string; critere: Critere }[] {
  return grille.domaines.flatMap((d) => d.normes.flatMap((n) => n.criteres.map((critere) => ({ domaine: d.nom, norme: n.code, critere }))));
}

describe.each(CAS)("grille officielle $type", ({ fichier, type, criteres: attendus, domaines }) => {
  const grille = lire(fichier);
  const liste = criteres(grille);

  it("a le type, les domaines et le nombre de critères essentiels annoncés par le manuel ARS", () => {
    expect(grille.type).toBe(type);
    expect(grille.domaines.map((d) => d.nom[0])).toEqual(domaines);
    expect(liste).toHaveLength(attendus);
    expect(new Set(liste.map((c) => c.critere.code)).size).toBe(attendus);
    for (const { critere } of liste) expect(critere.categorie).toBe("Essentiel");
  });

  it("range chaque critère sous la norme et le domaine de son code", () => {
    for (const { domaine, norme, critere } of liste) {
      expect(critere.code.startsWith(`${norme}.`)).toBe(true);
      expect(critere.code[0]).toBe(domaine[0]);
    }
  });

  it("n'a que des questions Oui/Non, et seuls les documents à examiner entrent dans le score (§6.2, §6.3)", () => {
    for (const { critere } of liste) {
      expect(critere.libelle.trim().length).toBeGreaterThan(0);
      expect(critere.elementsMesurables.some((e) => e.entreDansScore)).toBe(true);
      critere.elementsMesurables.forEach((e, i) => {
        expect(e.libelle.trim().length).toBeGreaterThan(0);
        expect(e.typeReponse).toBe("OUI_NON");
        expect(e.entreDansScore).toBe(e.typeElement === "DOCUMENT_A_EXAMINER");
        expect(e.ordre).toBe(i + 1);
      });
    }
  });

  it("est acceptée telle quelle par l'API d'administration des grilles", async () => {
    const { _source: _, ...payload } = grille;
    const erreurs = await validate(plainToInstance(CreateGrilleDto, payload), { whitelist: true, forbidNonWhitelisted: true });
    expect(erreurs).toEqual([]);
  });

  it("valide 100 % des critères quand tous les documents sont présents, même sans réponse aux entretiens", () => {
    let id = 0;
    const structure = {
      domaines: grille.domaines.map((d) => ({
        id: d.nom,
        nom: d.nom,
        normes: d.normes.map((n) => ({
          criteres: n.criteres.map((c) => ({
            id: c.code,
            code: c.code,
            libelle: c.libelle,
            elementsMesurables: c.elementsMesurables.map((e) => ({
              id: `e${++id}`,
              typeReponse: TypeReponse.OUI_NON,
              entreDansScore: e.entreDansScore,
            })),
          })),
        })),
      })),
    };
    const documents = structure.domaines.flatMap((d) =>
      d.normes.flatMap((n) => n.criteres.flatMap((c) => c.elementsMesurables.filter((e) => e.entreDansScore))),
    );
    const reponses = new Map<string, unknown>(documents.map((e) => [e.id, true]));
    expect(calculerScore(structure, reponses).scoreGlobal).toBe(100);

    // Un seul document manquant invalide son critère (§6.3).
    reponses.set(documents[0].id, false);
    const resultat = calculerScore(structure, reponses);
    expect(resultat.criteresNonValides).toHaveLength(1);
    expect(resultat.scoreGlobal).toBeLessThan(100);
  });
});

describe("grille officielle ESPC", () => {
  it("reprend la mention « Registre … » de chaque critère", () => {
    for (const { critere } of criteres(lire("espc.json"))) expect(critere.registre).toMatch(/^Registre \S+/);
  });
});
