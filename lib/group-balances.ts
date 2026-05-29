import { db } from "@/lib/db";
import {
  computeNetBalances,
  simplifyDebts,
  type ExpenseRecord,
  type SettlementRecord,
} from "@/lib/balances";
import { decimalToNumber } from "@/lib/session";

export async function getGroupBalanceData(groupId: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      expenses: {
        where: { deletedAt: null },
        include: { splits: true },
      },
      settlements: true,
    },
  });

  if (!group) return null;

  const userIds = group.members.map((m) => m.userId);
  const expenses: ExpenseRecord[] = group.expenses.map((e) => ({
    paidById: e.paidById,
    amount: decimalToNumber(e.amount),
    splits: e.splits.map((s) => ({
      userId: s.userId,
      amount: decimalToNumber(s.amount),
    })),
  }));

  const settlements: SettlementRecord[] = group.settlements.map((s) => ({
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    amount: decimalToNumber(s.amount),
  }));

  const netBalances = computeNetBalances(userIds, expenses, settlements);
  const simplifiedDebts = simplifyDebts(netBalances);

  return {
    group,
    netBalances,
    simplifiedDebts,
    members: group.members.map((m) => m.user),
  };
}

export async function getUserDashboardBalances(userId: string) {
  const memberships = await db.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: true,
          expenses: {
            where: { deletedAt: null },
            include: { splits: true },
          },
          settlements: true,
        },
      },
    },
  });

  let totalOwed = 0;
  let totalOwing = 0;
  const groupSummaries: Array<{
    groupId: string;
    groupName: string;
    balance: number;
  }> = [];

  for (const membership of memberships) {
    const group = membership.group;
    const userIds = group.members.map((m) => m.userId);
    const expenses: ExpenseRecord[] = group.expenses.map((e) => ({
      paidById: e.paidById,
      amount: decimalToNumber(e.amount),
      splits: e.splits.map((s) => ({
        userId: s.userId,
        amount: decimalToNumber(s.amount),
      })),
    }));
    const settlements: SettlementRecord[] = group.settlements.map((s) => ({
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amount: decimalToNumber(s.amount),
    }));

    const balances = computeNetBalances(userIds, expenses, settlements);
    const userBalance = balances.get(userId) ?? 0;

    if (userBalance > 0.01) totalOwed += userBalance;
    if (userBalance < -0.01) totalOwing += Math.abs(userBalance);

    groupSummaries.push({
      groupId: group.id,
      groupName: group.name,
      balance: userBalance,
    });
  }

  return { totalOwed, totalOwing, groupSummaries };
}
