"use client";

import { useActionState, useState } from "react";
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
import { createSettlementAction } from "@/lib/actions/expenses";

type Member = { id: string; name: string };

export function SettlementForm({
  groupId,
  members,
  currentUserId,
  suggestedDebts,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
  suggestedDebts: Array<{
    fromUserId: string;
    toUserId: string;
    amount: number;
  }>;
}) {
  const [state, formAction, pending] = useActionState(createSettlementAction, {});

  const defaultDebt = suggestedDebts.find(
    (d) => d.fromUserId === currentUserId || d.toUserId === currentUserId,
  );

  const [fromUserId, setFromUserId] = useState(
    defaultDebt?.fromUserId ?? currentUserId,
  );
  const [toUserId, setToUserId] = useState(defaultDebt?.toUserId ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="fromUserId" value={fromUserId} />
      <input type="hidden" name="toUserId" value={toUserId} />

      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      {state.success && <Alert>{state.success}</Alert>}

      <div className="space-y-2">
        <Label>From (who paid)</Label>
        <Select
          value={fromUserId}
          onValueChange={(v) => v && setFromUserId(v)}
        >
            <SelectTrigger className="w-full">
              <SelectValue />
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
        <Label>To (who received)</Label>
        <Select value={toUserId} onValueChange={(v) => v && setToUserId(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select recipient" />
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
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaultDebt?.amount.toFixed(2)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" name="note" rows={2} placeholder="Venmo, cash..." />
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Recording..." : "Record settlement"}
      </Button>
    </form>
  );
}
