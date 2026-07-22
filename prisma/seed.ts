import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  // No seed data yet — starter Club/Member models were replaced by the real schema.
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
