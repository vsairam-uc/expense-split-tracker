"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteExpenseAction } from "@/lib/actions/expenses";

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      className="w-full sm:w-auto"
      disabled={isPending}
      onClick={() => {
        if (
          confirm(
            "Delete this expense? This cannot be undone.",
          )
        ) {
          startTransition(async () => {
            await deleteExpenseAction(expenseId);
          });
        }
      }}
    >
      {isPending ? "Deleting..." : "Delete expense"}
    </Button>
  );
}
