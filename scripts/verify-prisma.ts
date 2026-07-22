import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const clubCount = await prisma.club.count();
  console.log(`✅ Connected (found ${clubCount} club(s))`);
}

main()
  .catch((e) => {
    console.error("❌ Connection failed:", e);
    // allow finally to run and disconnect cleanly
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
