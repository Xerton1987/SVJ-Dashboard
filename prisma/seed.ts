import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { runSeed } from "../lib/seed";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString: databaseUrl });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");
  const result = await runSeed(db);
  console.log("Created SVJ:", result.svj);
  console.log("Created units:", result.units);
  console.log("Seed completed successfully!\n");
  console.log("Test accounts:");
  for (const a of result.accounts) {
    console.log(`  ${a.role}: ${a.email} / ${a.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
