/**
 * Load comprehensive test data for manual QA and future E2E tests.
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts           # seed (fails if data exists)
 *   npx tsx scripts/seed-test-data.ts --force   # wipe seed data first, then reseed
 *
 * All seeded accounts use password: SeedPass123!
 * See docs/TEST_PLAN.md for the full manual test matrix.
 */
import { subDays } from "date-fns";
import { equalSplit } from "../lib/balances";
import {
  SEED_EMAIL_DOMAIN,
  SEED_PASSWORD,
  countSeedUsers,
  createSeedDb,
  deleteSeedData,
  disconnectSeedDb,
  hasFlag,
  hashSeedPassword,
} from "./seed-lib";

type UserKey =
  | "alice"
  | "bob"
  | "carol"
  | "dave"
  | "eve"
  | "admin"
  | "frank"
  | "grace";

const USER_DEFS: Record<
  UserKey,
  { name: string; role: "USER" | "ADMIN"; deleted?: boolean }
> = {
  alice: { name: "Alice Anderson", role: "USER" },
  bob: { name: "Bob Baker", role: "USER" },
  carol: { name: "Carol Chen", role: "USER" },
  dave: { name: "Dave Davis", role: "USER" },
  eve: { name: "Eve Edwards", role: "USER" },
  admin: { name: "Seed Admin", role: "ADMIN" },
  frank: { name: "Frank Foster", role: "USER", deleted: true },
  grace: { name: "Grace Green", role: "USER" },
};

function email(key: UserKey): string {
  return `${key}${SEED_EMAIL_DOMAIN}`;
}

function amt(value: number): string {
  return value.toFixed(2);
}

async function createPersonalGroup(
  db: Awaited<ReturnType<typeof createSeedDb>>["db"],
  creatorId: string,
  memberIds: string[],
  names: string[],
) {
  return db.group.create({
    data: {
      name: names.sort((a, b) => a.localeCompare(b)).join(" & "),
      isPersonal: true,
      createdById: creatorId,
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
    },
  });
}

async function createExpense(
  db: Awaited<ReturnType<typeof createSeedDb>>["db"],
  opts: {
    groupId: string;
    paidById: string;
    amount: number;
    description: string;
    category:
      | "GENERAL"
      | "FOOD"
      | "TRANSPORT"
      | "ENTERTAINMENT"
      | "UTILITIES"
      | "SHOPPING"
      | "TRAVEL"
      | "OTHER";
    splitType: "EQUAL" | "EXACT";
    participantIds: string[];
    payerId: string;
    exactSplits?: { userId: string; amount: number }[];
    expenseDate: Date;
    notes?: string;
    deleted?: boolean;
  },
) {
  const splits =
    opts.splitType === "EQUAL"
      ? equalSplit(opts.amount, opts.participantIds, opts.payerId)
      : (opts.exactSplits ?? []);

  return db.expense.create({
    data: {
      groupId: opts.groupId,
      paidById: opts.paidById,
      amount: amt(opts.amount),
      description: opts.description,
      category: opts.category,
      splitType: opts.splitType,
      expenseDate: opts.expenseDate,
      notes: opts.notes,
      deletedAt: opts.deleted ? subDays(new Date(), 2) : undefined,
      splits: {
        create: splits.map((s) => ({
          userId: s.userId,
          amount: amt(s.amount),
        })),
      },
    },
  });
}

async function main() {
  const force = hasFlag("--force") || hasFlag("--reset");
  const { db, pool } = await createSeedDb();

  try {
    const existing = await countSeedUsers(db);
    if (existing > 0 && !force) {
      console.error(
        `Found ${existing} seeded user(s) (${SEED_EMAIL_DOMAIN}). Run cleanup first or use --force.`,
      );
      console.error("  npx tsx scripts/cleanup-test-data.ts");
      console.error("  npx tsx scripts/seed-test-data.ts --force");
      process.exit(1);
    }

    if (force && existing > 0) {
      const removed = await deleteSeedData(db);
      console.log(`Removed ${removed.users} existing seeded user(s).`);
    }

    const passwordHash = await hashSeedPassword();
    const now = new Date();

    const users = {} as Record<UserKey, { id: string; name: string }>;
    for (const [key, def] of Object.entries(USER_DEFS) as [
      UserKey,
      (typeof USER_DEFS)[UserKey],
    ][]) {
      const user = await db.user.create({
        data: {
          email: email(key),
          name: def.name,
          passwordHash,
          role: def.role,
          deletedAt: def.deleted ? subDays(now, 7) : undefined,
        },
      });
      users[key] = { id: user.id, name: user.name };
    }

    // --- Friendships ---
    const friendships: { requester: UserKey; addressee: UserKey; status: "PENDING" | "ACCEPTED" | "DECLINED" }[] = [
      { requester: "alice", addressee: "bob", status: "ACCEPTED" },
      { requester: "alice", addressee: "carol", status: "ACCEPTED" },
      { requester: "alice", addressee: "dave", status: "ACCEPTED" },
      { requester: "bob", addressee: "carol", status: "ACCEPTED" },
      { requester: "carol", addressee: "dave", status: "PENDING" },
      { requester: "eve", addressee: "alice", status: "PENDING" },
      { requester: "bob", addressee: "eve", status: "PENDING" },
      { requester: "dave", addressee: "eve", status: "DECLINED" },
    ];

    for (const f of friendships) {
      await db.friendship.create({
        data: {
          requesterId: users[f.requester].id,
          addresseeId: users[f.addressee].id,
          status: f.status,
        },
      });
    }

    // Personal groups (mirror friend-accept flow)
    const personalPairs: [UserKey, UserKey][] = [
      ["alice", "bob"],
      ["alice", "carol"],
      ["alice", "dave"],
      ["bob", "carol"],
    ];
    const personalGroups: Record<string, string> = {};
    for (const [a, b] of personalPairs) {
      const group = await createPersonalGroup(
        db,
        users[a].id,
        [users[a].id, users[b].id],
        [users[a].name, users[b].name],
      );
      personalGroups[`${a}-${b}`] = group.id;
      personalGroups[`${b}-${a}`] = group.id;
    }

    // Multi-member groups
    const weekendTrip = await db.group.create({
      data: {
        name: "Weekend Cabin Trip",
        description: "Mountain getaway — shared cabin, groceries, and activities",
        isPersonal: false,
        createdById: users.alice.id,
        members: {
          create: ["alice", "bob", "carol", "dave"].map((k) => ({
            userId: users[k as UserKey].id,
          })),
        },
      },
    });

    const roommates = await db.group.create({
      data: {
        name: "Roommates",
        description: "Shared apartment utilities",
        isPersonal: false,
        createdById: users.bob.id,
        members: {
          create: ["bob", "carol", "dave"].map((k) => ({
            userId: users[k as UserKey].id,
          })),
        },
      },
    });

    const lunchClub = await db.group.create({
      data: {
        name: "Office Lunch Club",
        description: "Weekly team lunches downtown",
        isPersonal: false,
        createdById: users.alice.id,
        members: {
          create: ["alice", "bob", "carol", "dave", "eve"].map((k) => ({
            userId: users[k as UserKey].id,
          })),
        },
      },
    });

    const archivedGroup = await db.group.create({
      data: {
        name: "Archived Side Project",
        description: "Soft-deleted group for admin restore testing",
        isPersonal: false,
        createdById: users.alice.id,
        deletedAt: subDays(now, 14),
        members: {
          create: [{ userId: users.alice.id }, { userId: users.bob.id }],
        },
      },
    });

    // --- Expenses: Alice & Bob personal ---
    const aliceBobGroup = personalGroups["alice-bob"];
    await createExpense(db, {
      groupId: aliceBobGroup,
      paidById: users.alice.id,
      payerId: users.alice.id,
      amount: 45.5,
      description: "Dinner at Luigi's",
      category: "FOOD",
      splitType: "EQUAL",
      participantIds: [users.alice.id, users.bob.id],
      expenseDate: subDays(now, 3),
      notes: "Odd-cent equal split (remainder to payer)",
    });
    await createExpense(db, {
      groupId: aliceBobGroup,
      paidById: users.bob.id,
      payerId: users.bob.id,
      amount: 30,
      description: "Airport Uber",
      category: "TRANSPORT",
      splitType: "EXACT",
      participantIds: [users.alice.id, users.bob.id],
      exactSplits: [
        { userId: users.alice.id, amount: 18 },
        { userId: users.bob.id, amount: 12 },
      ],
      expenseDate: subDays(now, 10),
    });
    await createExpense(db, {
      groupId: aliceBobGroup,
      paidById: users.bob.id,
      payerId: users.bob.id,
      amount: 100,
      description: "Weekly groceries",
      category: "SHOPPING",
      splitType: "EQUAL",
      participantIds: [users.alice.id, users.bob.id],
      expenseDate: subDays(now, 21),
    });

    // Alice & Carol personal
    await createExpense(db, {
      groupId: personalGroups["alice-carol"],
      paidById: users.carol.id,
      payerId: users.carol.id,
      amount: 12,
      description: "Morning coffee",
      category: "FOOD",
      splitType: "EQUAL",
      participantIds: [users.alice.id, users.carol.id],
      expenseDate: subDays(now, 5),
    });

    // Weekend Cabin Trip
    await createExpense(db, {
      groupId: weekendTrip.id,
      paidById: users.alice.id,
      payerId: users.alice.id,
      amount: 400,
      description: "Airbnb — 2 nights",
      category: "TRAVEL",
      splitType: "EQUAL",
      participantIds: [users.alice.id, users.bob.id, users.carol.id, users.dave.id],
      expenseDate: subDays(now, 14),
    });
    await createExpense(db, {
      groupId: weekendTrip.id,
      paidById: users.dave.id,
      payerId: users.dave.id,
      amount: 67.33,
      description: "Gas for the drive",
      category: "TRANSPORT",
      splitType: "EQUAL",
      participantIds: [users.alice.id, users.bob.id, users.carol.id, users.dave.id],
      expenseDate: subDays(now, 13),
    });
    await createExpense(db, {
      groupId: weekendTrip.id,
      paidById: users.carol.id,
      payerId: users.carol.id,
      amount: 89.5,
      description: "Grocery run",
      category: "FOOD",
      splitType: "EXACT",
      participantIds: [users.alice.id, users.bob.id, users.carol.id, users.dave.id],
      exactSplits: [
        { userId: users.alice.id, amount: 22.5 },
        { userId: users.bob.id, amount: 20 },
        { userId: users.carol.id, amount: 25 },
        { userId: users.dave.id, amount: 22 },
      ],
      expenseDate: subDays(now, 12),
    });
    await createExpense(db, {
      groupId: weekendTrip.id,
      paidById: users.bob.id,
      payerId: users.bob.id,
      amount: 240,
      description: "Ski lift tickets",
      category: "ENTERTAINMENT",
      splitType: "EQUAL",
      participantIds: [users.alice.id, users.bob.id, users.carol.id],
      expenseDate: subDays(now, 11),
      notes: "Dave did not ski — subset of participants",
    });
    await createExpense(db, {
      groupId: weekendTrip.id,
      paidById: users.alice.id,
      payerId: users.alice.id,
      amount: 55,
      description: "Camping gear (cancelled)",
      category: "SHOPPING",
      splitType: "EQUAL",
      participantIds: [users.alice.id, users.bob.id, users.carol.id, users.dave.id],
      expenseDate: subDays(now, 15),
      deleted: true,
    });

    // Roommates (alice not a member — tests cross-group dashboard balances)
    await createExpense(db, {
      groupId: roommates.id,
      paidById: users.carol.id,
      payerId: users.carol.id,
      amount: 150,
      description: "Electric + water bill",
      category: "UTILITIES",
      splitType: "EQUAL",
      participantIds: [users.bob.id, users.carol.id, users.dave.id],
      expenseDate: subDays(now, 8),
    });
    await createExpense(db, {
      groupId: roommates.id,
      paidById: users.bob.id,
      payerId: users.bob.id,
      amount: 75,
      description: "Internet — March",
      category: "UTILITIES",
      splitType: "EQUAL",
      participantIds: [users.bob.id, users.carol.id, users.dave.id],
      expenseDate: subDays(now, 6),
    });

    // Office Lunch Club
    await createExpense(db, {
      groupId: lunchClub.id,
      paidById: users.eve.id,
      payerId: users.eve.id,
      amount: 125,
      description: "Team lunch — Thai Garden",
      category: "FOOD",
      splitType: "EQUAL",
      participantIds: [
        users.alice.id,
        users.bob.id,
        users.carol.id,
        users.dave.id,
        users.eve.id,
      ],
      expenseDate: subDays(now, 4),
    });
    await createExpense(db, {
      groupId: lunchClub.id,
      paidById: users.alice.id,
      payerId: users.alice.id,
      amount: 48,
      description: "Birthday cake for Dave",
      category: "FOOD",
      splitType: "EXACT",
      participantIds: [users.alice.id, users.bob.id, users.carol.id, users.dave.id, users.eve.id],
      exactSplits: [
        { userId: users.alice.id, amount: 0 },
        { userId: users.bob.id, amount: 12 },
        { userId: users.carol.id, amount: 12 },
        { userId: users.dave.id, amount: 0 },
        { userId: users.eve.id, amount: 24 },
      ],
      expenseDate: subDays(now, 2),
      notes: "Organizers covered their share",
    });

    // --- Settlements ---
    await db.settlement.createMany({
      data: [
        {
          groupId: weekendTrip.id,
          fromUserId: users.bob.id,
          toUserId: users.alice.id,
          amount: amt(50),
          note: "Partial Airbnb share",
          settledAt: subDays(now, 7),
        },
        {
          groupId: weekendTrip.id,
          fromUserId: users.dave.id,
          toUserId: users.carol.id,
          amount: amt(25),
          note: "Grocery split",
          settledAt: subDays(now, 6),
        },
        {
          groupId: aliceBobGroup,
          fromUserId: users.bob.id,
          toUserId: users.alice.id,
          amount: amt(20),
          note: "Uber reimbursement",
          settledAt: subDays(now, 9),
        },
        {
          groupId: roommates.id,
          fromUserId: users.dave.id,
          toUserId: users.bob.id,
          amount: amt(30),
          note: "Internet share",
          settledAt: subDays(now, 5),
        },
        {
          groupId: lunchClub.id,
          fromUserId: users.carol.id,
          toUserId: users.eve.id,
          amount: amt(15),
          settledAt: subDays(now, 1),
        },
        {
          groupId: weekendTrip.id,
          fromUserId: users.carol.id,
          toUserId: users.alice.id,
          amount: amt(10),
          note: "Voided payment",
          settledAt: subDays(now, 20),
          deletedAt: subDays(now, 18),
        },
      ],
    });

  const quiet = hasFlag("--quiet");
  if (!quiet) {
    printSummary(users, {
      weekendTrip: weekendTrip.id,
      roommates: roommates.id,
      lunchClub: lunchClub.id,
      archivedGroup: archivedGroup.id,
      aliceBobGroup,
    });
  }
  } finally {
    await disconnectSeedDb(db, pool);
  }
}

function printSummary(
  users: Record<UserKey, { id: string; name: string }>,
  groups: Record<string, string>,
) {
  console.log("\n✔ Test data seeded successfully.\n");
  console.log("── Login (all accounts) ──");
  console.log(`  Password: ${SEED_PASSWORD}\n`);

  const loginUsers: UserKey[] = ["alice", "bob", "carol", "dave", "eve", "admin", "grace"];
  for (const key of loginUsers) {
    const role = USER_DEFS[key].role === "ADMIN" ? " (ADMIN)" : "";
    console.log(`  ${users[key].name.padEnd(18)} ${email(key)}${role}`);
  }

  console.log("\n── Suggested primary test account ──");
  console.log(`  alice@seed.test — friends, groups, expenses, pending requests\n`);

  console.log("── Key groups (log in as alice) ──");
  console.log(`  Weekend Cabin Trip     /groups/${groups.weekendTrip}`);
  console.log(`  Office Lunch Club    /groups/${groups.lunchClub}`);
  console.log(`  Roommates            /groups/${groups.roommates} (alice not a member)`);
  console.log(`  Archived (deleted)   /groups/${groups.archivedGroup} (admin restore)\n`);

  console.log("── Edge-case accounts ──");
  console.log(`  frank@seed.test — soft-deleted user (login should fail)`);
  console.log(`  grace@seed.test — no friends (empty dashboard)\n`);

  console.log("── Cleanup ──");
  console.log("  npm run clear-db\n");
  console.log("── Full test matrix ──");
  console.log("  docs/TEST_PLAN.md\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
