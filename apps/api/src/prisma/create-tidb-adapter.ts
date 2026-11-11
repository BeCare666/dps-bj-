import { readFileSync } from "node:fs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// TiDB Cloud impose TLS. Le pilote `mariadb` ne comprend pas le paramètre
// `?sslaccept=strict` de l'URL (spécifique à mysql2) : on construit donc une
// config explicite avec le CA plutôt que de passer la chaîne DATABASE_URL brute.
// DATABASE_SSL=false désactive TLS (base MySQL/MariaDB locale sur le serveur).
export function createTidbAdapter(databaseUrl: string, caPath: string) {
  const url = new URL(databaseUrl);
  const sslActif = process.env.DATABASE_SSL !== "false";

  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 4000),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: sslActif ? { ca: readFileSync(caPath, "utf8"), minVersion: "TLSv1.2" } : false,
    connectionLimit: 5,
  });
}
