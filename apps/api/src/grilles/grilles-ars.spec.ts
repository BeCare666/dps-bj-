import "reflect-metadata";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateGrilleDto } from "./dto/create-grille.dto.js";
import { calculerScore } from "../sessions-evaluation/scoring.util.js";
import { TypeReponse } from "../generated/prisma/enums.js";

// Grilles officielles ARS (prisma/grilles-ars/), converties des fichiers Excel
// de mise_a_jour/ et importées par le seed. Les effectifs attendus sont ceux
// annoncés par les manuels ARS : EH 25 essentiels, 94 fondamentaux, 15 avancés
// (134) ; ESPC 30 essentiels, 78 fondamentaux, 17 avancés (125).

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

const DOMAINES = ["A", "B", "C", "D", "E"];
const CAS = [
  { fichier: "eh.json", type: "EH", categorie: "Essentiel", criteres: 25, domaines: DOMAINES },
  { fichier: "eh-fondamental.json", type: "EH", categorie: "Fondamental", criteres: 94, domaines: DOMAINES },
  { fichier: "eh-avance.json", type: "EH", categorie: "Avancé", criteres: 15, domaines: DOMAINES },
  { fichier: "espc.json", type: "ESPC", categorie: "Essentiel", criteres: 30, domaines: DOMAINES },
  { fichier: "espc-fondamental.json", type: "ESPC", categorie: "Fondamental", criteres: 78, domaines: DOMAINES },
  { fichier: "espc-avance.json", type: "ESPC", categorie: "Avancé", criteres: 17, domaines: DOMAINES },
];

function criteres(grille: Grille): { domaine: string; norme: string; critere: Critere }[] {
  return grille.domaines.flatMap((d) => d.normes.flatMap((n) => n.criteres.map((critere) => ({ domaine: d.nom, norme: n.code, critere }))));
}

describe.each(CAS)("grille officielle $type $categorie", ({ fichier, type, categorie, criteres: attendus, domaines }) => {
  const grille = lire(fichier);
  const liste = criteres(grille);

  it("a le type, les domaines et le nombre de critères annoncés par le manuel ARS", () => {
    expect(grille.type).toBe(type);
    expect(grille.domaines.map((d) => d.nom[0])).toEqual(domaines);
    expect(liste).toHaveLength(attendus);
    expect(new Set(liste.map((c) => c.critere.code)).size).toBe(attendus);
    for (const { critere } of liste) expect(critere.categorie).toBe(categorie);
  });

  it("range chaque critère sous la norme et le domaine de son code", () => {
    for (const { domaine, norme, critere } of liste) {
      expect(critere.code.startsWith(`${norme}.`)).toBe(true);
      expect(critere.code[0]).toBe(domaine[0]);
    }
  });

  it("n'a que des questions Présent/Absent/Observations, et seuls les documents à examiner entrent dans le score (§6.2, §6.3)", () => {
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
            categorie: c.categorie,
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
    const reponses = new Map<string, unknown>(documents.map((e) => [e.id, "PRESENT"]));
    expect(calculerScore(structure, reponses).scoreGlobal).toBe(100);

    // Tous les documents du premier critère absents : critère à 0 (§6.3).
    const premier = structure.domaines[0].normes[0].criteres[0];
    for (const e of premier.elementsMesurables.filter((x) => x.entreDansScore)) reponses.set(e.id, "ABSENT");
    const resultat = calculerScore(structure, reponses);
    expect(resultat.criteresNonValides).toHaveLength(1);
    expect(resultat.criteresNonValides[0]).toMatchObject({ code: premier.code, score: 0 });
    expect(resultat.scoreGlobal).toBeLessThan(100);
  });
});

describe("grilles officielles mises à jour", () => {
  it("ont des noms distincts, et les grilles essentielles gardent le nom de leur v1 (nouvelle version, pas nouvelle grille)", () => {
    const noms = CAS.map((c) => lire(c.fichier).nom);
    expect(new Set(noms).size).toBe(CAS.length);
    expect(lire("eh.json").nom).toBe("Grille d'auto-évaluation des critères essentiels des EH");
    expect(lire("espc.json").nom).toBe("Grille d'auto-évaluation des critères essentiels des ESPC");
  });

  it("totalisent les effectifs des manuels : EH 134 critères, ESPC 125", () => {
    const total = (type: string) => CAS.filter((c) => c.type === type).reduce((s, c) => s + criteres(lire(c.fichier)).length, 0);
    expect(total("EH")).toBe(134);
    expect(total("ESPC")).toBe(125);
  });
});
