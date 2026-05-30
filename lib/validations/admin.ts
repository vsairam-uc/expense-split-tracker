import { z } from "zod";

const roleEnum = z.enum(["USER", "ADMIN"]);
const categoryEnum = z.enum([
  "GENERAL",
  "FOOD",
  "TRANSPORT",
  "ENTERTAINMENT",
  "UTILITIES",
  "SHOPPING",
  "TRAVEL",
  "OTHER",
]);

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  role: roleEnum,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  role: roleEnum,
  password: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || v.length >= 8, {
      message: "Password must be at least 8 characters",
    }),
});

export const adminGroupUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: optionalText,
  isPersonal: z.coerce.boolean(),
});

export const adminExpenseUpdateSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().trim().min(1).max(8).default("USD"),
  category: categoryEnum,
  notes: optionalText,
  expenseDate: z.coerce.date(),
});

export const adminSettlementCreateSchema = z.object({
  groupId: z.string().trim().min(1, "Group ID is required"),
  fromUserId: z.string().trim().min(1, "From user is required"),
  toUserId: z.string().trim().min(1, "To user is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: optionalText,
  settledAt: z.coerce.date().optional(),
});

export const adminSettlementUpdateSchema = z.object({
  fromUserId: z.string().trim().min(1, "From user is required"),
  toUserId: z.string().trim().min(1, "To user is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: optionalText,
  settledAt: z.coerce.date(),
});
