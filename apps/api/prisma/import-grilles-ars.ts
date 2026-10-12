// Import ponctuel des grilles officielles ARS dans une base existante
// (une base neuve les reçoit via le seed) : npx tsx prisma/import-grilles-ars.ts
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { createTidbAdapter } from "../src/prisma/create-tidb-adapter.js";
import { importerGrillesArs } from "./grilles-ars/importer.js";

const certsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "certs");
const prisma = new PrismaClient({ adapter: createTidbAdapter(process.env.DATABASE_URL!, join(certsDir, "tidb-ca.pem")) });

importerGrillesArs(prisma)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
