import { db } from "@/lib/db";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  url?: string,
) {
  try {
    return await db.notification.create({
      data: {
        userId,
        title,
        message,
        url,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
