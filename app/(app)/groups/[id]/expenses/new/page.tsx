import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpenseForm } from "@/components/expense-form";
import { createExpenseAction } from "@/lib/actions/expenses";
import { getGroupDetail } from "@/lib/actions/groups";
import { auth } from "@/lib/auth";

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const group = await getGroupDetail(id);
  if (!group) notFound();

  const members = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add expense</h1>
        <p className="text-muted-foreground">In {group.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            groupId={id}
            members={members}
            currentUserId={session!.user!.id}
            action={createExpenseAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
