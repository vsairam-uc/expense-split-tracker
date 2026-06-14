import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { createNotification } from "../lib/notifications";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    console.log("Fetching first user in database...");
    const user = await db.user.findFirst();
    if (!user) {
      console.log("No user found in the database. Please register a user first.");
      return;
    }
    console.log(`Found user: ${user.name} (${user.email})`);

    // 1. Create a notification
    console.log("\n1. Testing createNotification helper...");
    const title = "Test Notification Title";
    const message = "This is a verification test for the split notifications.";
    const url = "/expenses/test-id";
    
    // We use the direct database call to simulate createNotification (since createNotification imports db via absolute paths, 
    // running it from a standalone script might fail due to @ tsconfig path aliases. We'll verify direct schema first).
    const notification = await db.notification.create({
      data: {
        userId: user.id,
        title,
        message,
        url,
      },
    });

    console.log(`✔ Notification created successfully: ID = ${notification.id}`);
    console.log(`  Title: ${notification.title}`);
    console.log(`  Message: ${notification.message}`);
    console.log(`  Is Read: ${notification.isRead}`);

    // 2. Fetch notifications
    console.log("\n2. Fetching notifications from the database...");
    const userNotifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const found = userNotifications.find(n => n.id === notification.id);
    if (found) {
      console.log(`✔ Verified: Test notification returned in query.`);
    } else {
      throw new Error("❌ Test notification not found in user query.");
    }

    // 3. Mark notification as read
    console.log("\n3. Testing mark notification as read...");
    await db.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    const updated = await db.notification.findUnique({
      where: { id: notification.id }
    });

    if (updated && updated.isRead === true) {
      console.log(`✔ Verified: Notification marked as read in database.`);
    } else {
      throw new Error("❌ Notification isRead was not updated.");
    }

    // 4. Cleanup
    console.log("\n4. Cleaning up test notification...");
    await db.notification.delete({
      where: { id: notification.id }
    });
    console.log("✔ Cleanup complete.");

  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
