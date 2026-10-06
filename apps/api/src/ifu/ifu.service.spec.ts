import { IfuService, extraireNom } from "./ifu.service.js";

const IFU = "1234567890123";

function serviceAvecReponse(reponse: { status: number; corps: string } | Error) {
  const service = new IfuService();
  const appeler = vi
    .spyOn(service as unknown as { appeler: (ifu: string) => Promise<unknown> }, "appeler")
    .mockImplementation(async () => {
      if (reponse instanceof Error) throw reponse;
      return reponse;
    });
  return { service, appeler };
}

describe("IfuService", () => {
  const cleInitiale = process.env.IFU_API_KEY;

  beforeEach(() => {
    process.env.IFU_API_KEY = "cle-test";
  });

  afterAll(() => {
    if (cleInitiale === undefined) delete process.env.IFU_API_KEY;
    else process.env.IFU_API_KEY = cleInitiale;
  });

  it("renvoie non_configure sans clé, sans appeler la DGI", async () => {
    delete process.env.IFU_API_KEY;
    const { service, appeler } = serviceAvecReponse({ status: 200, corps: "{}" });

    expect(await service.verifier(IFU)).toEqual({ statut: "non_configure" });
    expect(appeler).not.toHaveBeenCalled();
  });

  it.each(["123", "12345678901234", "12345678901A3", ""])("rejette le format %j sans appeler la DGI", async (ifu) => {
    const { service, appeler } = serviceAvecReponse({ status: 200, corps: "{}" });

    expect(await service.verifier(ifu)).toEqual({ statut: "introuvable" });
    expect(appeler).not.toHaveBeenCalled();
  });

  it("personne morale : renvoie la dénomination de l'entreprise", async () => {
    const corps = JSON.stringify({
      contribuable: { nom: "DOSSOU", prenom: "Jean" },
      entreprise: { denomination: "CLINIQUE DE LA PAIX", nomUsuel: "Clinique Paix" },
    });
    const { service, appeler } = serviceAvecReponse({ status: 200, corps });

    expect(await service.verifier(IFU)).toEqual({ statut: "trouve", nom: "CLINIQUE DE LA PAIX" });
    expect(appeler).toHaveBeenCalledWith(IFU);
  });

  it("404 → introuvable", async () => {
    const { service } = serviceAvecReponse({ status: 404, corps: "" });
    expect(await service.verifier(IFU)).toEqual({ statut: "introuvable" });
  });

  it("200 sans contribuable ni entreprise → introuvable", async () => {
    const { service } = serviceAvecReponse({ status: 200, corps: JSON.stringify({ result: "x" }) });
    expect(await service.verifier(IFU)).toEqual({ statut: "introuvable" });
  });

  it.each([401, 403, 500])("HTTP %i → indisponible", async (status) => {
    const { service } = serviceAvecReponse({ status, corps: "" });
    expect(await service.verifier(IFU)).toEqual({ statut: "indisponible" });
  });

  it("erreur réseau (ex. certificat expiré) → indisponible", async () => {
    const { service } = serviceAvecReponse(new Error("certificate has expired"));
    expect(await service.verifier(IFU)).toEqual({ statut: "indisponible" });
  });

  it("200 non JSON → indisponible", async () => {
    const { service } = serviceAvecReponse({ status: 200, corps: "<html>" });
    expect(await service.verifier(IFU)).toEqual({ statut: "indisponible" });
  });
});

describe("extraireNom", () => {
  it("préfère la dénomination, puis le nom usuel", () => {
    expect(extraireNom({ entreprise: { denomination: " ", nomUsuel: "Centre Médical X" } })).toBe("Centre Médical X");
  });

  it("personne physique : nom puis prénom", () => {
    expect(extraireNom({ contribuable: { nom: "DOSSOU", prenom: "Jean" }, entreprise: null })).toBe("DOSSOU Jean");
  });

  it("aucun nom exploitable → null", () => {
    expect(extraireNom({ contribuable: { nom: null, prenom: "" } })).toBeNull();
  });
});
