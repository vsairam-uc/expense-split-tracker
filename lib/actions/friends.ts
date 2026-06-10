"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { decimalToNumber } from "@/lib/session";
import {
  computePairwiseBalance,
  type ExpenseRecord,
  type SettlementRecord,
} from "@/lib/balances";
import type { ActionState } from "@/lib/actions/auth";

export async function searchUsersAction(query: string) {
  const user = await requireUser();
  if (!query.trim()) return [];

  const users = await db.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        { deletedAt: null },
        {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 10,
  });

  const friendships = await db.friendship.findMany({
    where: {
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      AND: {
        OR: [
          { requesterId: { in: users.map((u) => u.id) } },
          { addresseeId: { in: users.map((u) => u.id) } },
        ],
      },
    },
  });

  return users.map((u) => {
    const friendship = friendships.find(
      (f) =>
        (f.requesterId === user.id && f.addresseeId === u.id) ||
        (f.addresseeId === user.id && f.requesterId === u.id),
    );
    return {
      ...u,
      friendshipStatus: friendship?.status ?? null,
      friendshipId: friendship?.id ?? null,
      isRequester: friendship?.requesterId === user.id,
    };
  });
}

export async function sendFriendRequestAction(
  addresseeId: string,
): Promise<ActionState> {
  const user = await requireUser();
  if (addresseeId === user.id) {
    return { error: "You cannot add yourself" };
  }

  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId },
        { requesterId: addresseeId, addresseeId: user.id },
      ],
    },
  });

  if (existing) {
    return { error: "Friend request already exists" };
  }

  await db.friendship.create({
    data: {
      requesterId: user.id,
      addresseeId,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard");
  return { success: "Friend request sent" };
}

export async function respondFriendRequestAction(
  friendshipId: string,
  accept: boolean,
): Promise<ActionState> {
  const user = await requireUser();
  const friendship = await db.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship || friendship.addresseeId !== user.id) {
    return { error: "Friend request not found" };
  }

  if (friendship.status !== "PENDING") {
    return { error: "Request already handled" };
  }

  await db.friendship.update({
    where: { id: friendshipId },
    data: { status: accept ? "ACCEPTED" : "DECLINED" },
  });

  if (accept) {
    const { findOrCreateGroupForParticipants } = await import(
      "@/lib/find-or-create-group"
    );
    await findOrCreateGroupForParticipants(
      user.id,
      [user.id, friendship.requesterId],
      user.id,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");
  return { success: accept ? "Friend request accepted" : "Friend request declined" };
}

export async function getFriendsData() {
  const user = await requireUser();

  const friendships = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      addressee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const pendingIncoming = await db.friendship.findMany({
    where: { addresseeId: user.id, status: "PENDING" },
    include: {
      requester: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingOutgoing = await db.friendship.findMany({
    where: { requesterId: user.id, status: "PENDING" },
    include: {
      addressee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = friendships.map((f) =>
    f.requesterId === user.id ? f.addressee : f.requester,
  );

  return { friends, pendingIncoming, pendingOutgoing };
}

export async function getFriendDetail(friendId: string) {
  const user = await requireUser();

  const friendship = await db.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: user.id, addresseeId: friendId },
        { requesterId: friendId, addresseeId: user.id },
      ],
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      addressee: { select: { id: true, name: true, email: true } },
    },
  });

  if (!friendship) return null;

  const friend =
    friendship.requesterId === user.id
      ? friendship.addressee
      : friendship.requester;

  const sharedGroups = await db.group.findMany({
    where: {
      deletedAt: null,
      AND: [
        { members: { some: { userId: user.id } } },
        { members: { some: { userId: friendId } } },
      ],
    },
    include: {
      expenses: {
        where: { deletedAt: null },
        include: {
          paidBy: { select: { id: true, name: true } },
          splits: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
        orderBy: { expenseDate: "desc" },
      },
      settlements: {
        where: { deletedAt: null },
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
        orderBy: { settledAt: "desc" },
      },
    },
  });

  const balanceExpenses: ExpenseRecord[] = [];
  const balanceSettlements: SettlementRecord[] = [];

  type ExpenseActivity = {
    kind: "expense";
    id: string;
    groupId: string;
    groupName: string;
    description: string;
    amount: number;
    date: Date;
    paidBy: { id: string; name: string };
    splitType: string;
  };
  type SettlementActivity = {
    kind: "settlement";
    id: string;
    groupId: string;
    groupName: string;
    amount: number;
    date: Date;
    fromUser: { id: string; name: string };
    toUser: { id: string; name: string };
  };
  const activities: (ExpenseActivity | SettlementActivity)[] = [];

  for (const group of sharedGroups) {
    for (const expense of group.expenses) {
      const involvesBoth =
        (expense.paidById === user.id &&
          expense.splits.some((s) => s.userId === friendId)) ||
        (expense.paidById === friendId &&
          expense.splits.some((s) => s.userId === user.id));
      if (!involvesBoth) continue;

      balanceExpenses.push({
        paidById: expense.paidById,
        amount: decimalToNumber(expense.amount),
        splits: expense.splits.map((s) => ({
          userId: s.userId,
          amount: decimalToNumber(s.amount),
        })),
      });

      activities.push({
        kind: "expense",
        id: expense.id,
        groupId: group.id,
        groupName: group.name,
        description: expense.description,
        amount: decimalToNumber(expense.amount),
        date: expense.expenseDate,
        paidBy: expense.paidBy,
        splitType: expense.splitType,
      });
    }

    for (const settlement of group.settlements) {
      const involvesBoth =
        (settlement.fromUserId === user.id &&
          settlement.toUserId === friendId) ||
        (settlement.fromUserId === friendId &&
          settlement.toUserId === user.id);
      if (!involvesBoth) continue;

      balanceSettlements.push({
        fromUserId: settlement.fromUserId,
        toUserId: settlement.toUserId,
        amount: decimalToNumber(settlement.amount),
      });

      activities.push({
        kind: "settlement",
        id: settlement.id,
        groupId: group.id,
        groupName: group.name,
        amount: decimalToNumber(settlement.amount),
        date: settlement.settledAt,
        fromUser: settlement.fromUser,
        toUser: settlement.toUser,
      });
    }
  }

  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  const balance = computePairwiseBalance(
    user.id,
    friendId,
    balanceExpenses,
    balanceSettlements,
  );

  return { friend, balance, activities, userId: user.id };
}

export async function getFriendsDashboardData() {
  const user = await requireUser();

  const [friendsData, memberships] = await Promise.all([
    getFriendsData(),
    db.groupMember.findMany({
      where: { userId: user.id, group: { deletedAt: null } },
      include: {
        group: {
          include: {
            expenses: {
              where: { deletedAt: null },
              include: { splits: true },
            },
            settlements: { where: { deletedAt: null } },
          },
        },
      },
    }),
  ]);

  const expenses: ExpenseRecord[] = [];
  const settlements: SettlementRecord[] = [];

  for (const membership of memberships) {
    for (const e of membership.group.expenses) {
      expenses.push({
        paidById: e.paidById,
        amount: decimalToNumber(e.amount),
        splits: e.splits.map((s) => ({
          userId: s.userId,
          amount: decimalToNumber(s.amount),
        })),
      });
    }
    for (const s of membership.group.settlements) {
      settlements.push({
        fromUserId: s.fromUserId,
        toUserId: s.toUserId,
        amount: decimalToNumber(s.amount),
      });
    }
  }

  let totalOwed = 0;
  let totalOwing = 0;

  const friends = friendsData.friends.map((friend) => {
    const balance = computePairwiseBalance(
      user.id,
      friend.id,
      expenses,
      settlements,
    );
    if (balance > 0.01) totalOwed += balance;
    if (balance < -0.01) totalOwing += Math.abs(balance);
    return { ...friend, balance };
  });

  return {
    friends,
    pendingIncoming: friendsData.pendingIncoming,
    pendingOutgoing: friendsData.pendingOutgoing,
    totalOwed,
    totalOwing,
  };
}
