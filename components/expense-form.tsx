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
import { cn } from "@/lib/utils";
import {
  Receipt,
  Utensils,
  Car,
  Film,
  Zap,
  ShoppingBag,
  Plane,
  MoreHorizontal,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

const categoryConfig: Record<
  typeof categories[number],
  { label: string; icon: LucideIcon; colorClass: string; bgClass: string }
> = {
  GENERAL: {
    label: "General",
    icon: Receipt,
    colorClass: "text-slate-600 dark:text-slate-300",
    bgClass: "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60",
  },
  FOOD: {
    label: "Food",
    icon: Utensils,
    colorClass: "text-emerald-600 dark:text-emerald-300",
    bgClass: "bg-emerald-100 dark:bg-emerald-800/60 border-emerald-200 dark:border-emerald-700/60",
  },
  TRANSPORT: {
    label: "Transport",
    icon: Car,
    colorClass: "text-sky-600 dark:text-sky-300",
    bgClass: "bg-sky-100 dark:bg-sky-800/60 border-sky-200 dark:border-sky-700/60",
  },
  ENTERTAINMENT: {
    label: "Movies",
    icon: Film,
    colorClass: "text-purple-600 dark:text-purple-300",
    bgClass: "bg-purple-100 dark:bg-purple-800/60 border-purple-200 dark:border-purple-700/60",
  },
  UTILITIES: {
    label: "Bills",
    icon: Zap,
    colorClass: "text-amber-600 dark:text-amber-300",
    bgClass: "bg-amber-100 dark:bg-amber-800/60 border-amber-200 dark:border-amber-700/60",
  },
  SHOPPING: {
    label: "Shopping",
    icon: ShoppingBag,
    colorClass: "text-pink-600 dark:text-pink-300",
    bgClass: "bg-pink-100 dark:bg-pink-800/60 border-pink-200 dark:border-pink-700/60",
  },
  TRAVEL: {
    label: "Travel",
    icon: Plane,
    colorClass: "text-indigo-600 dark:text-indigo-300",
    bgClass: "bg-indigo-100 dark:bg-indigo-800/60 border-indigo-200 dark:border-indigo-700/60",
  },
  OTHER: {
    label: "Other",
    icon: MoreHorizontal,
    colorClass: "text-stone-600 dark:text-stone-300",
    bgClass: "bg-stone-100 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60",
  },
};

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

function getInitials(name: string) {
  const clean = name.replace(/\(you\)/i, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

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

  const memberNameFor = (id: unknown) =>
    members.find((m) => m.id === id)?.name ?? "";

  return (
    <form action={formAction} className="space-y-6">
      {groupId && <input type="hidden" name="groupId" value={groupId} />}
      <input type="hidden" name="splitType" value={splitType} />
      <input type="hidden" name="paidById" value={paidById} />
      <input type="hidden" name="category" value={category} />

      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      {state.success && <Alert>{state.success}</Alert>}

      {/* Description & Amount Hero Section */}
      <div className="space-y-4 rounded-xl border border-dashed border-border/80 p-5 bg-card/30">
        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs uppercase tracking-widest text-muted-foreground">What is this for?</Label>
          <Input
            id="description"
            name="description"
            required
            defaultValue={defaultValues?.description}
            placeholder="Dinner, groceries, rent..."
            className="text-lg font-medium border-0 border-b border-border/60 rounded-none px-0 py-1 bg-transparent focus-visible:ring-0 focus-visible:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col items-center justify-center py-4 border-t border-dashed border-border/80">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-1">How much?</span>
          <div className="flex items-center text-4xl sm:text-5xl font-semibold font-mono text-foreground focus-within:text-primary transition-colors">
            <span>$</span>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-40 text-center bg-transparent border-0 p-0 focus:ring-0 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Category selector */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Category</Label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {categories.map((c) => {
            const config = categoryConfig[c];
            const Icon = config.icon;
            const isSelected = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer",
                  isSelected
                    ? cn("border-primary ring-2 ring-primary/20", config.bgClass)
                    : "border-border bg-card hover:bg-muted/40"
                )}
              >
                <span className={cn("p-1.5 rounded-lg", isSelected ? config.colorClass : "text-muted-foreground")}>
                  <Icon className="size-5" />
                </span>
                <span className={cn("text-[10px] truncate w-full", isSelected ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Participant Selection */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Select Participants</Label>
        <div className="flex flex-wrap gap-4">
          {members.map((m) => {
            const initials = getInitials(m.name);
            const isSelected = participantIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleParticipant(m.id)}
                className="group relative flex flex-col items-center gap-1.5 focus:outline-hidden cursor-pointer"
              >
                {/* Hidden Checkbox for normal form submission */}
                <input
                  type="checkbox"
                  name="participantIds"
                  value={m.id}
                  checked={isSelected}
                  readOnly
                  className="sr-only"
                />
                <div
                  className={cn(
                    "relative flex size-12 items-center justify-center rounded-full border-2 text-sm font-medium transition-all shadow-xs",
                    isSelected
                      ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 scale-105"
                      : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  {initials}
                  {isSelected && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs">
                      <Check className="size-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs truncate max-w-[72px] text-center transition-colors",
                    isSelected
                      ? "font-medium text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {m.name.replace(/\(you\)/i, "").trim()}
                  {m.name.includes("(you)") && <span className="text-[10px] block text-muted-foreground">(you)</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date, Paid By & Notes section */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expenseDate" className="text-xs uppercase tracking-widest text-muted-foreground">Date</Label>
          <Input
            id="expenseDate"
            name="expenseDate"
            type="date"
            required
            defaultValue={defaultValues?.expenseDate ?? today}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Paid by</Label>
          <Select
            value={paidById}
            onValueChange={(v) => v && setPaidById(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select payer">
                {(value) => memberNameFor(value)}
              </SelectValue>
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes" className="text-xs uppercase tracking-widest text-muted-foreground">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues?.notes}
            placeholder="Add details, notes, or split details..."
            rows={2}
          />
        </div>
      </div>

      {/* Split Type section */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Split type</Label>
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
        <div className="rounded-lg border p-4 text-sm bg-card/30">
          <p className="mb-2 font-medium">Split preview</p>
          <ul className="space-y-1">
            {equalPreview.map((s) => {
              const member = members.find((m) => m.id === s.userId);
              return (
                <li key={s.userId} className="flex justify-between">
                  <span>{member?.name}</span>
                  <span className="font-mono">${s.amount.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {splitType === "EXACT" && (
        <div className="space-y-3 rounded-lg border p-4 bg-card/30">
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
                  className="w-full font-mono"
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
        className="w-full sm:w-auto cursor-pointer"
        disabled={pending || participantIds.length === 0}
      >
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
