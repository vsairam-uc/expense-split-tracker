/**
 * Promote (or demote) a user to the ADMIN role by email.
 *
 * Usage:
 *   npx tsx scripts/make-admin.ts user@example.com           # promote to ADMIN
 *   npx tsx scripts/make-admin.ts user@example.com --demote   # demote to USER
 *
 * Requires DATABASE_URL to be set (loaded from .env via dotenv).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";

async function main() {
  const email = process.argv[2]?.toLowerCase();
  const demote = process.argv.includes("--demote");

  if (!email) {
    console.error("Error: please provide an email address.");
    console.error("Usage: npx tsx scripts/make-admin.ts <email> [--demote]");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    const role = demote ? "USER" : "ADMIN";
    await db.user.update({ where: { email }, data: { role } });
    console.log(`✔ ${email} is now ${role}.`);
  } finally {
    await db.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
