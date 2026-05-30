import { auth } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function isGroupMember(groupId: string, userId: string) {
  const { db } = await import("@/lib/db");
  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });
  return !!membership;
}

export async function requireGroupMember(groupId: string, userId: string) {
  const member = await isGroupMember(groupId, userId);
  if (!member) {
    throw new Error("Forbidden");
  }
}

export async function getAcceptedFriendIds(userId: string) {
  const { db } = await import("@/lib/db");
  const friendships = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
  });

  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function decimalToNumber(value: { toString(): string } | number) {
  return typeof value === "number" ? value : Number(value.toString());
}
