/**
 * Create a new user with the ADMIN role (or promote one if the email exists).
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts --email you@example.com --password 'StrongPass123' --name 'Your Name'
 *
 * Requires DATABASE_URL to be set (loaded from .env via dotenv).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = getArg("--email")?.toLowerCase();
  const password = getArg("--password");
  const name = getArg("--name") ?? "Admin";

  if (!email || !password) {
    console.error("Error: --email and --password are required.");
    console.error(
      "Usage: npx tsx scripts/create-admin.ts --email you@example.com --password 'StrongPass123' --name 'Your Name'",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Error: password must be at least 8 characters.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.upsert({
      where: { email },
      update: { role: "ADMIN", passwordHash, name, deletedAt: null },
      create: { email, name, passwordHash, role: "ADMIN" },
    });
    console.log(`✔ ${user.email} is ready as ADMIN (id: ${user.id}).`);
  } finally {
    await db.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
