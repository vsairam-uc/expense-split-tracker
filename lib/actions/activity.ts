"use server";

import { db } from "@/lib/db";
import { decimalToNumber, requireUser } from "@/lib/session";

export type ActivityItem =
  | {
      kind: "expense";
      id: string;
      date: Date;
      description: string;
      groupId: string;
      groupName: string;
      amount: number;
      paidByName: string;
      paidByYou: boolean;
      // Net effect on the current user for this expense.
      // Positive => the user lent money (is owed), negative => the user borrowed (owes).
      net: number;
    }
  | {
      kind: "settlement";
      id: string;
      date: Date;
      groupId: string;
      groupName: string;
      amount: number;
      fromName: string;
      toName: string;
      paidByYou: boolean;
      receivedByYou: boolean;
      // Positive => the user received money, negative => the user paid.
      net: number;
    };

export async function getUserActivity(): Promise<ActivityItem[]> {
  const user = await requireUser();
  const userId = user.id;

  const [expenses, settlements] = await Promise.all([
    db.expense.findMany({
      where: {
        deletedAt: null,
        OR: [{ paidById: userId }, { splits: { some: { userId } } }],
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
        splits: { select: { userId: true, amount: true } },
      },
      orderBy: { expenseDate: "desc" },
    }),
    db.settlement.findMany({
      where: {
        deletedAt: null,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { settledAt: "desc" },
    }),
  ]);

  const expenseItems: ActivityItem[] = expenses.map((expense) => {
    const amount = decimalToNumber(expense.amount);
    const paidByYou = expense.paidById === userId;
    const yourShare = expense.splits
      .filter((s) => s.userId === userId)
      .reduce((sum, s) => sum + decimalToNumber(s.amount), 0);

    // If you paid, you front the full amount and get back everyone else's shares.
    const net = (paidByYou ? amount : 0) - yourShare;

    return {
      kind: "expense",
      id: expense.id,
      date: expense.expenseDate,
      description: expense.description,
      groupId: expense.group.id,
      groupName: expense.group.name,
      amount,
      paidByName: expense.paidBy.name,
      paidByYou,
      net,
    };
  });

  const settlementItems: ActivityItem[] = settlements.map((settlement) => {
    const amount = decimalToNumber(settlement.amount);
    const paidByYou = settlement.fromUserId === userId;
    const receivedByYou = settlement.toUserId === userId;

    return {
      kind: "settlement",
      id: settlement.id,
      date: settlement.settledAt,
      groupId: settlement.group.id,
      groupName: settlement.group.name,
      amount,
      fromName: settlement.fromUser.name,
      toName: settlement.toUser.name,
      paidByYou,
      receivedByYou,
      net: receivedByYou ? amount : -amount,
    };
  });

  return [...expenseItems, ...settlementItems].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
}
