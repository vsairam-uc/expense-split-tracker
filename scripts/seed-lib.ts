/**
 * Shared helpers for seeding and cleaning test data.
 * All seeded users use emails ending in @seed.test so cleanup is scoped and safe.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";

export const SEED_EMAIL_DOMAIN = "@seed.test";
export const SEED_PASSWORD = "SeedPass123!";

export type SeedDb = PrismaClient;

export function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

export function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

export async function createSeedDb(): Promise<{ db: SeedDb; pool: Pool }> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
  }

  const pool = new Pool({ connectionString: url });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { db, pool };
}

export async function disconnectSeedDb(db: SeedDb, pool: Pool): Promise<void> {
  await db.$disconnect();
  await pool.end();
}

export async function hashSeedPassword(): Promise<string> {
  return bcrypt.hash(SEED_PASSWORD, 12);
}

export async function countSeedUsers(db: SeedDb): Promise<number> {
  return db.user.count({
    where: { email: { endsWith: SEED_EMAIL_DOMAIN } },
  });
}

export async function deleteSeedData(db: SeedDb): Promise<{
  users: number;
}> {
  const result = await db.user.deleteMany({
    where: { email: { endsWith: SEED_EMAIL_DOMAIN } },
  });
  return { users: result.count };
}
