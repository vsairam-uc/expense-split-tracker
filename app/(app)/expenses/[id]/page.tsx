import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { getExpenseDetail } from "@/lib/actions/expenses";
import { formatCurrency } from "@/lib/session";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await getExpenseDetail(id);
  if (!expense) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <PageHeader
        eyebrow="Expense"
        title={expense.description}
        description={`${expense.group.name} · ${format(expense.expenseDate, "MMM d, yyyy")}`}
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/expenses/${id}/edit`} />}
          className="w-full sm:w-auto"
        >
          <Pencil className="size-4" />
          Edit
        </Button>
        <DeleteExpenseButton expenseId={id} />
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Amount</span>
            <span className="tabular font-mono text-xl font-medium">
              {formatCurrency(expense.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Paid by</span>
            <span className="text-right font-medium">{expense.paidBy.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Category</span>
            <Badge variant="outline">{expense.category.toLowerCase()}</Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Split type</span>
            <span className="capitalize">{expense.splitType.toLowerCase()}</span>
          </div>
          {expense.notes && (
            <div>
              <p className="text-muted-foreground">Notes</p>
              <p className="mt-1 break-words">{expense.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Split breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {expense.splits.map((split) => (
              <li
                key={split.id}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <span className="min-w-0 truncate">{split.user.name}</span>
                <span className="tabular shrink-0 font-mono font-medium">
                  {formatCurrency(split.amount)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Link
        href={`/groups/${expense.groupId}`}
        className="inline-block font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to group
      </Link>
    </div>
  );
}
