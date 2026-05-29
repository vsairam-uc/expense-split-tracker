import { z } from "zod";

export const expenseSchema = z.object({
  groupId: z.string().min(1),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  expenseDate: z.coerce.date(),
  paidById: z.string().min(1, "Select who paid"),
  category: z.enum([
    "GENERAL",
    "FOOD",
    "TRANSPORT",
    "ENTERTAINMENT",
    "UTILITIES",
    "SHOPPING",
    "TRAVEL",
    "OTHER",
  ]),
  notes: z.string().optional(),
  splitType: z.enum(["EQUAL", "EXACT"]),
  participantIds: z.array(z.string()).min(1, "Select at least one participant"),
  exactSplits: z
    .array(
      z.object({
        userId: z.string(),
        amount: z.coerce.number().nonnegative(),
      }),
    )
    .optional(),
});

export const settlementSchema = z.object({
  groupId: z.string().min(1),
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  note: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SettlementInput = z.infer<typeof settlementSchema>;
