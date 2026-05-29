"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  equalSplit,
  validateExactSplits,
} from "@/lib/balances";
import { expenseSchema, settlementSchema } from "@/lib/validations/expense";
import { decimalToNumber, requireGroupMember, requireUser } from "@/lib/session";
import type { ActionState } from "@/lib/actions/auth";

function parseExactSplits(formData: FormData, participantIds: string[]) {
  return participantIds.map((userId) => ({
    userId,
    amount: Number(formData.get(`split_${userId}`) ?? 0),
  }));
}

export async function createExpenseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const participantIds = formData.getAll("participantIds") as string[];
  const splitType = formData.get("splitType") as "EQUAL" | "EXACT";

  const parsed = expenseSchema.safeParse({
    groupId: formData.get("groupId"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate"),
    paidById: formData.get("paidById"),
    category: formData.get("category"),
    notes: formData.get("notes") || undefined,
    splitType,
    participantIds,
    exactSplits:
      splitType === "EXACT" ? parseExactSplits(formData, participantIds) : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { groupId, amount, paidById, splitType: type } = parsed.data;
  await requireGroupMember(groupId, user.id);

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group) return { error: "Group not found" };

  const memberIds = new Set(group.members.map((m) => m.userId));
  for (const pid of parsed.data.participantIds) {
    if (!memberIds.has(pid)) {
      return { error: "Invalid participant" };
    }
  }
  if (!memberIds.has(paidById)) {
    return { error: "Payer must be a group member" };
  }

  let splits: { userId: string; amount: number }[];
  if (type === "EQUAL") {
    splits = equalSplit(amount, parsed.data.participantIds, paidById);
  } else {
    splits = parsed.data.exactSplits ?? [];
    if (!validateExactSplits(amount, splits)) {
      return { error: "Split amounts must sum to the expense total" };
    }
  }

  const expense = await db.expense.create({
    data: {
      groupId,
      paidById,
      amount,
      description: parsed.data.description,
      category: parsed.data.category,
      notes: parsed.data.notes,
      expenseDate: parsed.data.expenseDate,
      splitType: type,
      splits: {
        create: splits.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
      },
    },
  });

  revalidatePath(`/groups/${groupId}`);
  redirect(`/expenses/${expense.id}`);
}

export async function updateExpenseAction(
  expenseId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const participantIds = formData.getAll("participantIds") as string[];
  const splitType = formData.get("splitType") as "EQUAL" | "EXACT";

  const existing = await db.expense.findUnique({
    where: { id: expenseId },
    include: { group: { include: { members: true } } },
  });
  if (!existing || existing.deletedAt) {
    return { error: "Expense not found" };
  }

  await requireGroupMember(existing.groupId, user.id);

  const parsed = expenseSchema.safeParse({
    groupId: existing.groupId,
    description: formData.get("description"),
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate"),
    paidById: formData.get("paidById"),
    category: formData.get("category"),
    notes: formData.get("notes") || undefined,
    splitType,
    participantIds,
    exactSplits:
      splitType === "EXACT" ? parseExactSplits(formData, participantIds) : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const memberIds = new Set(existing.group.members.map((m) => m.userId));
  for (const pid of parsed.data.participantIds) {
    if (!memberIds.has(pid)) return { error: "Invalid participant" };
  }
  if (!memberIds.has(parsed.data.paidById)) {
    return { error: "Payer must be a group member" };
  }

  let splits: { userId: string; amount: number }[];
  if (parsed.data.splitType === "EQUAL") {
    splits = equalSplit(
      parsed.data.amount,
      parsed.data.participantIds,
      parsed.data.paidById,
    );
  } else {
    splits = parsed.data.exactSplits ?? [];
    if (!validateExactSplits(parsed.data.amount, splits)) {
      return { error: "Split amounts must sum to the expense total" };
    }
  }

  await db.$transaction([
    db.expenseSplit.deleteMany({ where: { expenseId } }),
    db.expense.update({
      where: { id: expenseId },
      data: {
        paidById: parsed.data.paidById,
        amount: parsed.data.amount,
        description: parsed.data.description,
        category: parsed.data.category,
        notes: parsed.data.notes,
        expenseDate: parsed.data.expenseDate,
        splitType: parsed.data.splitType,
        splits: {
          create: splits.map((s) => ({
            userId: s.userId,
            amount: s.amount,
          })),
        },
      },
    }),
  ]);

  revalidatePath(`/groups/${existing.groupId}`);
  revalidatePath(`/expenses/${expenseId}`);
  return { success: "Expense updated" };
}

export async function deleteExpenseAction(expenseId: string): Promise<ActionState> {
  const user = await requireUser();
  const expense = await db.expense.findUnique({ where: { id: expenseId } });
  if (!expense || expense.deletedAt) {
    return { error: "Expense not found" };
  }

  await requireGroupMember(expense.groupId, user.id);

  await db.expense.update({
    where: { id: expenseId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/groups/${expense.groupId}`);
  redirect(`/groups/${expense.groupId}`);
}

export async function createSettlementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = settlementSchema.safeParse({
    groupId: formData.get("groupId"),
    fromUserId: formData.get("fromUserId"),
    toUserId: formData.get("toUserId"),
    amount: formData.get("amount"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { groupId, fromUserId, toUserId, amount } = parsed.data;
  if (fromUserId === toUserId) {
    return { error: "Cannot settle with yourself" };
  }

  await requireGroupMember(groupId, user.id);

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  if (!group) return { error: "Group not found" };

  const memberIds = new Set(group.members.map((m) => m.userId));
  if (!memberIds.has(fromUserId) || !memberIds.has(toUserId)) {
    return { error: "Both users must be group members" };
  }

  await db.settlement.create({
    data: {
      groupId,
      fromUserId,
      toUserId,
      amount,
      note: parsed.data.note,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: "Settlement recorded" };
}

export async function getExpenseDetail(expenseId: string) {
  const user = await requireUser();
  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: {
        include: { user: { select: { id: true, name: true } } },
      },
      group: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!expense || expense.deletedAt) return null;
  await requireGroupMember(expense.groupId, user.id);

  return {
    ...expense,
    amount: decimalToNumber(expense.amount),
    splits: expense.splits.map((s) => ({
      ...s,
      amount: decimalToNumber(s.amount),
    })),
  };
}
