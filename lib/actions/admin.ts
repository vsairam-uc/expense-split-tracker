"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { getAdminModel, PAGE_SIZE } from "@/lib/admin/models";
import {
  adminExpenseUpdateSchema,
  adminGroupUpdateSchema,
  adminSettlementCreateSchema,
  adminSettlementUpdateSchema,
  adminUserCreateSchema,
  adminUserUpdateSchema,
} from "@/lib/validations/admin";
import type { ActionState } from "@/lib/actions/auth";

// Maps the public url slug to the Prisma delegate.
function getDelegate(modelKey: string) {
  switch (modelKey) {
    case "users":
      return db.user;
    case "groups":
      return db.group;
    case "expenses":
      return db.expense;
    case "settlements":
      return db.settlement;
    default:
      return null;
  }
}

type PlainRecord = Record<string, string | number | boolean | null>;

// Converts Prisma records (Decimal, Date) into plain serializable values so
// they can cross the server/client boundary.
function serializeRecord(record: Record<string, unknown>): PlainRecord {
  const out: PlainRecord = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) {
      out[key] = null;
    } else if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (
      typeof value === "object" &&
      typeof (value as { toNumber?: unknown }).toNumber === "function"
    ) {
      out[key] = Number((value as { toString(): string }).toString());
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

export async function getModelCounts() {
  await requireAdmin();
  const [users, groups, expenses, settlements] = await Promise.all([
    db.user.count(),
    db.group.count(),
    db.expense.count(),
    db.settlement.count(),
  ]);
  return { users, groups, expenses, settlements };
}

export async function listRecords(
  modelKey: string,
  options: { page?: number; search?: string } = {},
) {
  await requireAdmin();
  const model = getAdminModel(modelKey);
  const delegate = getDelegate(modelKey);
  if (!model || !delegate) {
    throw new Error("Unknown model");
  }

  const page = Math.max(1, options.page ?? 1);
  const search = options.search?.trim();

  const where =
    search && model.searchFields.length > 0
      ? {
          OR: model.searchFields.map((field) => ({
            [field]: { contains: search, mode: "insensitive" as const },
          })),
        }
      : {};

  const [total, rows] = await Promise.all([
    // @ts-expect-error -- delegate is a union of Prisma delegates
    delegate.count({ where }),
    // @ts-expect-error -- delegate is a union of Prisma delegates
    delegate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return {
    rows: (rows as Record<string, unknown>[]).map(serializeRecord),
    total: total as number,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil((total as number) / PAGE_SIZE)),
  };
}

export async function getRecord(modelKey: string, id: string) {
  await requireAdmin();
  const delegate = getDelegate(modelKey);
  if (!delegate) throw new Error("Unknown model");

  // @ts-expect-error -- delegate is a union of Prisma delegates
  const record = await delegate.findUnique({ where: { id } });
  if (!record) return null;
  return serializeRecord(record as Record<string, unknown>);
}

export async function createRecordAction(
  modelKey: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  if (modelKey === "users") {
    const parsed = adminUserCreateSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const email = parsed.data.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists" };
    }
    await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        role: parsed.data.role,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
      },
    });
  } else if (modelKey === "settlements") {
    const parsed = adminSettlementCreateSchema.safeParse({
      groupId: formData.get("groupId"),
      fromUserId: formData.get("fromUserId"),
      toUserId: formData.get("toUserId"),
      amount: formData.get("amount"),
      note: formData.get("note") || undefined,
      settledAt: formData.get("settledAt") || undefined,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    if (parsed.data.fromUserId === parsed.data.toUserId) {
      return { error: "From and to users must differ" };
    }
    const integrityError = await validateSettlementRefs(parsed.data);
    if (integrityError) return { error: integrityError };

    await db.settlement.create({
      data: {
        groupId: parsed.data.groupId,
        fromUserId: parsed.data.fromUserId,
        toUserId: parsed.data.toUserId,
        amount: parsed.data.amount,
        note: parsed.data.note,
        settledAt: parsed.data.settledAt ?? new Date(),
      },
    });
  } else {
    return { error: "This model does not support creation" };
  }

  revalidatePath(`/admin/${modelKey}`);
  return { success: "Record created" };
}

export async function updateRecordAction(
  modelKey: string,
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  switch (modelKey) {
    case "users": {
      const parsed = adminUserUpdateSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role"),
        password: formData.get("password") || undefined,
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      if (id === admin.id && parsed.data.role !== "ADMIN") {
        return { error: "You cannot remove your own admin role" };
      }
      const email = parsed.data.email.toLowerCase();
      const clash = await db.user.findFirst({
        where: { email, id: { not: id } },
      });
      if (clash) {
        return { error: "Another account already uses this email" };
      }
      await db.user.update({
        where: { id },
        data: {
          name: parsed.data.name,
          email,
          role: parsed.data.role,
          ...(parsed.data.password
            ? { passwordHash: await bcrypt.hash(parsed.data.password, 12) }
            : {}),
        },
      });
      break;
    }
    case "groups": {
      const parsed = adminGroupUpdateSchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description") || undefined,
        isPersonal: formData.get("isPersonal"),
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      await db.group.update({
        where: { id },
        data: {
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          isPersonal: parsed.data.isPersonal,
        },
      });
      break;
    }
    case "expenses": {
      const parsed = adminExpenseUpdateSchema.safeParse({
        description: formData.get("description"),
        amount: formData.get("amount"),
        currency: formData.get("currency") || "USD",
        category: formData.get("category"),
        notes: formData.get("notes") || undefined,
        expenseDate: formData.get("expenseDate"),
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      await db.expense.update({
        where: { id },
        data: {
          description: parsed.data.description,
          amount: parsed.data.amount,
          currency: parsed.data.currency,
          category: parsed.data.category,
          notes: parsed.data.notes ?? null,
          expenseDate: parsed.data.expenseDate,
        },
      });
      break;
    }
    case "settlements": {
      const parsed = adminSettlementUpdateSchema.safeParse({
        fromUserId: formData.get("fromUserId"),
        toUserId: formData.get("toUserId"),
        amount: formData.get("amount"),
        note: formData.get("note") || undefined,
        settledAt: formData.get("settledAt"),
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
      }
      if (parsed.data.fromUserId === parsed.data.toUserId) {
        return { error: "From and to users must differ" };
      }
      const existing = await db.settlement.findUnique({ where: { id } });
      if (!existing) return { error: "Settlement not found" };
      const integrityError = await validateSettlementRefs({
        groupId: existing.groupId,
        fromUserId: parsed.data.fromUserId,
        toUserId: parsed.data.toUserId,
      });
      if (integrityError) return { error: integrityError };

      await db.settlement.update({
        where: { id },
        data: {
          fromUserId: parsed.data.fromUserId,
          toUserId: parsed.data.toUserId,
          amount: parsed.data.amount,
          note: parsed.data.note ?? null,
          settledAt: parsed.data.settledAt,
        },
      });
      break;
    }
    default:
      return { error: "Unknown model" };
  }

  revalidatePath(`/admin/${modelKey}`);
  revalidatePath(`/admin/${modelKey}/${id}`);
  return { success: "Record updated" };
}

export async function softDeleteRecordAction(
  modelKey: string,
  id: string,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const delegate = getDelegate(modelKey);
  if (!delegate) return { error: "Unknown model" };

  if (modelKey === "users" && id === admin.id) {
    return { error: "You cannot delete your own account" };
  }

  // @ts-expect-error -- delegate is a union of Prisma delegates
  await delegate.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath(`/admin/${modelKey}`);
  return { success: "Record deleted" };
}

export async function restoreRecordAction(
  modelKey: string,
  id: string,
): Promise<ActionState> {
  await requireAdmin();
  const delegate = getDelegate(modelKey);
  if (!delegate) return { error: "Unknown model" };

  // @ts-expect-error -- delegate is a union of Prisma delegates
  await delegate.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath(`/admin/${modelKey}`);
  return { success: "Record restored" };
}

async function validateSettlementRefs(refs: {
  groupId: string;
  fromUserId: string;
  toUserId: string;
}): Promise<string | null> {
  const [group, fromUser, toUser] = await Promise.all([
    db.group.findUnique({ where: { id: refs.groupId } }),
    db.user.findUnique({ where: { id: refs.fromUserId } }),
    db.user.findUnique({ where: { id: refs.toUserId } }),
  ]);
  if (!group) return "Group not found";
  if (!fromUser) return "From user not found";
  if (!toUser) return "To user not found";
  return null;
}
