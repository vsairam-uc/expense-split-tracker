"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  url: string | null;
  isRead: boolean;
  createdAt: Date;
};

export async function getNotificationsAction(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  const user = await requireUser();

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    db.notification.count({
      where: { userId: user.id, isRead: false },
    }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      url: n.url,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    unreadCount,
  };
}

export async function markNotificationAsReadAction(id: string) {
  const user = await requireUser();

  const notification = await db.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== user.id) {
    return { error: "Notification not found" };
  }

  await db.notification.update({
    where: { id },
    data: { isRead: true },
  });

  revalidatePath("/");
  return { success: true };
}

export async function markAllNotificationsAsReadAction() {
  const user = await requireUser();

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/");
  return { success: true };
}
