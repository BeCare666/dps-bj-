import { Injectable, Logger } from "@nestjs/common";
import { request } from "node:https";

// Vérification d'un IFU auprès de l'API IFUONLINE de la DGI (« IFU API
// Integration », v3.1.2, §2 « Rechercher un contribuable avec son numéro
// IFU ») : GET {BaseURL}/{ifu}, en-tête `Apikey`, réponse 200 = contribuable
// trouvé, 404 = inconnu, 401/403 = clé refusée.
//
// ⚠️ Non testé contre l'API réelle avec une clé valide : la clé figurant dans
// le PDF est déclarée invalide par la DGI elle-même (une clé est délivrée par
// email formel à chaque demandeur). Seuls la joignabilité du serveur et le
// 401 sans clé ont été constatés (06/10/2026).
//
// Le certificat HTTPS de backend.impots.bj a expiré le 31/12/2024 (constaté
// le 06/10/2026) : la vérification TLS ne peut être désactivée que par
// IFU_API_TLS_INSECURE=true, et uniquement pour cet appel.

const BASE_URL_PAR_DEFAUT = "https://backend.impots.bj:8443/onlineifu-prod/api/contribuable";
const DELAI_MS = 10_000;

export type ResultatVerificationIfu =
  | { statut: "trouve"; nom: string | null }
  | { statut: "introuvable" }
  | { statut: "indisponible" }
  | { statut: "non_configure" };

interface ReponseHttp {
  status: number;
  corps: string;
}

// Seuls les champs utiles au nom sont lus ; le reste de la réponse (données
// personnelles du contribuable) n'est ni conservé ni journalisé.
interface ReponseContribuable {
  contribuable?: { nom?: string | null; prenom?: string | null } | null;
  entreprise?: { denomination?: string | null; nomUsuel?: string | null } | null;
}

function nettoyer(valeur: string | null | undefined): string | null {
  const v = valeur?.trim();
  return v ? v : null;
}

// Personne morale : dénomination, sinon nom usuel. Personne physique : nom et
// prénom (l'objet JSON est identique dans les deux cas, cf. PDF §2).
export function extraireNom(reponse: ReponseContribuable): string | null {
  const entreprise = reponse.entreprise;
  const nomEntreprise = nettoyer(entreprise?.denomination) ?? nettoyer(entreprise?.nomUsuel);
  if (nomEntreprise) return nomEntreprise;

  const contribuable = reponse.contribuable;
  const nomPersonne = [nettoyer(contribuable?.nom), nettoyer(contribuable?.prenom)].filter(Boolean).join(" ");
  return nomPersonne || null;
}

@Injectable()
export class IfuService {
  private readonly logger = new Logger(IfuService.name);

  estConfigure(): boolean {
    return Boolean(process.env.IFU_API_KEY);
  }

  async verifier(ifu: string): Promise<ResultatVerificationIfu> {
    if (!/^\d{13}$/.test(ifu)) return { statut: "introuvable" };
    if (!this.estConfigure()) return { statut: "non_configure" };

    let reponse: ReponseHttp;
    try {
      reponse = await this.appeler(ifu);
    } catch (erreur) {
      this.logger.warn(`API IFU injoignable : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
      return { statut: "indisponible" };
    }

    if (reponse.status === 404) return { statut: "introuvable" };
    if (reponse.status !== 200) {
      this.logger.warn(`API IFU : réponse HTTP ${reponse.status}`);
      return { statut: "indisponible" };
    }

    let json: ReponseContribuable;
    try {
      json = JSON.parse(reponse.corps) as ReponseContribuable;
    } catch {
      this.logger.warn("API IFU : réponse 200 non JSON");
      return { statut: "indisponible" };
    }

    if (!json.contribuable && !json.entreprise) return { statut: "introuvable" };
    return { statut: "trouve", nom: extraireNom(json) };
  }

  protected appeler(ifu: string): Promise<ReponseHttp> {
    const base = (process.env.IFU_API_URL || BASE_URL_PAR_DEFAUT).replace(/\/+$/, "");
    const url = `${base}/${ifu}`;

    return new Promise((resolve, reject) => {
      const req = request(
        url,
        {
          method: "GET",
          headers: {
            Apikey: process.env.IFU_API_KEY!,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          rejectUnauthorized: process.env.IFU_API_TLS_INSECURE !== "true",
          timeout: DELAI_MS,
        },
        (res) => {
          const morceaux: Buffer[] = [];
          res.on("data", (m: Buffer) => morceaux.push(m));
          res.on("end", () => resolve({ status: res.statusCode ?? 0, corps: Buffer.concat(morceaux).toString("utf8") }));
          res.on("error", reject);
        },
      );
      req.on("timeout", () => req.destroy(new Error(`délai de ${DELAI_MS} ms dépassé`)));
      req.on("error", reject);
      req.end();
    });
  }
}
