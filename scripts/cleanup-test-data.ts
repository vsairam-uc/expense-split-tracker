/**
 * Remove all seeded test data (@seed.test users and cascaded records).
 *
 * Usage:
 *   npx tsx scripts/cleanup-test-data.ts
 *   npx tsx scripts/cleanup-test-data.ts --dry-run
 *
 * Only deletes users whose email ends with @seed.test — real accounts are untouched.
 */
import {
  SEED_EMAIL_DOMAIN,
  countSeedUsers,
  createSeedDb,
  deleteSeedData,
  disconnectSeedDb,
  hasFlag,
} from "./seed-lib";

async function main() {
  const dryRun = hasFlag("--dry-run");
  const { db, pool } = await createSeedDb();

  try {
    const count = await countSeedUsers(db);

    if (count === 0) {
      console.log(`No seeded users found (${SEED_EMAIL_DOMAIN}). Nothing to clean up.`);
      return;
    }

    const seedUsers = await db.user.findMany({
      where: { email: { endsWith: SEED_EMAIL_DOMAIN } },
      select: { email: true, name: true, role: true },
      orderBy: { email: "asc" },
    });

    if (dryRun) {
      console.log(`Dry run — would delete ${count} user(s) and all cascaded data:\n`);
      for (const u of seedUsers) {
        console.log(`  • ${u.name} <${u.email}> [${u.role}]`);
      }
      console.log(
        "\nRun without --dry-run to delete. Related groups, expenses, friendships, and settlements cascade automatically.",
      );
      return;
    }

    const result = await deleteSeedData(db);
    console.log(`✔ Removed ${result.users} seeded user(s) and all related data.`);
    console.log(`  (${SEED_EMAIL_DOMAIN} accounts only — other users were not touched.)`);
  } finally {
    await disconnectSeedDb(db, pool);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
