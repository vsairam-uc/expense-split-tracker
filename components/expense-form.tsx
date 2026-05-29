"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { equalSplit } from "@/lib/balances";
import type { ActionState } from "@/lib/actions/auth";

type Member = { id: string; name: string };

const categories = [
  "GENERAL",
  "FOOD",
  "TRANSPORT",
  "ENTERTAINMENT",
  "UTILITIES",
  "SHOPPING",
  "TRAVEL",
  "OTHER",
] as const;

type ExpenseFormProps = {
  groupId?: string;
  members: Member[];
  currentUserId: string;
  action: (
    prevState: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  defaultValues?: {
    description?: string;
    amount?: number;
    expenseDate?: string;
    paidById?: string;
    category?: string;
    notes?: string;
    splitType?: "EQUAL" | "EXACT";
    participantIds?: string[];
    exactSplits?: Record<string, number>;
  };
  submitLabel?: string;
};

export function ExpenseForm({
  groupId,
  members,
  currentUserId,
  action,
  defaultValues,
  submitLabel = "Add expense",
}: ExpenseFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [splitType, setSplitType] = useState<"EQUAL" | "EXACT">(
    defaultValues?.splitType ?? "EQUAL",
  );
  const [amount, setAmount] = useState(
    defaultValues?.amount?.toString() ?? "",
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    defaultValues?.participantIds ?? members.map((m) => m.id),
  );
  const [paidById, setPaidById] = useState(
    defaultValues?.paidById ?? currentUserId,
  );
  const [category, setCategory] = useState(
    defaultValues?.category ?? "GENERAL",
  );
  const [exactSplits, setExactSplits] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      for (const member of members) {
        initial[member.id] =
          defaultValues?.exactSplits?.[member.id]?.toString() ?? "0";
      }
      return initial;
    },
  );

  const equalPreview = useMemo(() => {
    const numAmount = Number(amount);
    if (!numAmount || participantIds.length === 0) return [];
    try {
      return equalSplit(numAmount, participantIds, paidById);
    } catch {
      return [];
    }
  }, [amount, participantIds, paidById]);

  function toggleParticipant(id: string) {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-6">
      {groupId && <input type="hidden" name="groupId" value={groupId} />}
      <input type="hidden" name="splitType" value={splitType} />
      <input type="hidden" name="paidById" value={paidById} />
      <input type="hidden" name="category" value={category} />

      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      {state.success && <Alert>{state.success}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            required
            defaultValue={defaultValues?.description}
            placeholder="Dinner, groceries, rent..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expenseDate">Date</Label>
          <Input
            id="expenseDate"
            name="expenseDate"
            type="date"
            required
            defaultValue={defaultValues?.expenseDate ?? today}
          />
        </div>
        <div className="space-y-2">
          <Label>Paid by</Label>
          <Select
            value={paidById}
            onValueChange={(v) => v && setPaidById(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select payer" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => v && setCategory(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.charAt(0) + c.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues?.notes}
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Participants</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name="participantIds"
                value={m.id}
                checked={participantIds.includes(m.id)}
                onChange={() => toggleParticipant(m.id)}
              />
              {m.name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Split type</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="w-full sm:w-auto"
            variant={splitType === "EQUAL" ? "default" : "outline"}
            onClick={() => setSplitType("EQUAL")}
          >
            Split equally
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            variant={splitType === "EXACT" ? "default" : "outline"}
            onClick={() => setSplitType("EXACT")}
          >
            Enter exact amounts
          </Button>
        </div>
      </div>

      {splitType === "EQUAL" && equalPreview.length > 0 && (
        <div className="rounded-lg border p-4 text-sm">
          <p className="mb-2 font-medium">Split preview</p>
          <ul className="space-y-1">
            {equalPreview.map((s) => {
              const member = members.find((m) => m.id === s.userId);
              return (
                <li key={s.userId} className="flex justify-between">
                  <span>{member?.name}</span>
                  <span>${s.amount.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {splitType === "EXACT" && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Exact amounts</p>
          {members
            .filter((m) => participantIds.includes(m.id))
            .map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
              >
                <Label className="shrink-0 sm:w-32">{m.name}</Label>
                <Input
                  className="w-full"
                  name={`split_${m.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={exactSplits[m.id] ?? "0"}
                  onChange={(e) =>
                    setExactSplits((prev) => ({
                      ...prev,
                      [m.id]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
        </div>
      )}

      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={pending || participantIds.length === 0}
      >
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
