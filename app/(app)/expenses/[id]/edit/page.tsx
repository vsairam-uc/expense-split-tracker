import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpenseForm } from "@/components/expense-form";
import { getExpenseDetail, updateExpenseAction } from "@/lib/actions/expenses";
import { auth } from "@/lib/auth";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const expense = await getExpenseDetail(id);
  if (!expense) notFound();

  const members = expense.group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
  }));

  const exactSplits: Record<string, number> = {};
  for (const split of expense.splits) {
    exactSplits[split.userId] = split.amount;
  }

  const boundAction = updateExpenseAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit expense</h1>
        <p className="text-muted-foreground">{expense.description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            groupId={expense.groupId}
            members={members}
            currentUserId={session!.user!.id}
            action={boundAction}
            submitLabel="Save changes"
            defaultValues={{
              description: expense.description,
              amount: expense.amount,
              expenseDate: expense.expenseDate.toISOString().split("T")[0],
              paidById: expense.paidById,
              category: expense.category,
              notes: expense.notes ?? undefined,
              splitType: expense.splitType,
              participantIds: expense.splits.map((s) => s.userId),
              exactSplits,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
