import Link from "next/link";
import { format } from "date-fns";
import { Plus, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserDashboardBalances } from "@/lib/group-balances";
import { formatCurrency, decimalToNumber } from "@/lib/session";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const { totalOwed, totalOwing, groupSummaries } =
    await getUserDashboardBalances(userId);

  const recentExpenses = await db.expense.findMany({
    where: {
      deletedAt: null,
      group: { members: { some: { userId } } },
    },
    include: {
      paidBy: { select: { name: true } },
      group: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A clear read on your shared expenses."
      >
        <Button
          nativeButton={false}
          render={<Link href="/expenses/new" />}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Add expense
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-lg border border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            You are owed
          </p>
          <p className="tabular mt-3 font-mono text-3xl font-medium text-positive sm:text-4xl">
            {formatCurrency(totalOwed)}
          </p>
        </div>
        <div className="p-6">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            You owe
          </p>
          <p className="tabular mt-3 font-mono text-3xl font-medium text-negative sm:text-4xl">
            {formatCurrency(totalOwing)}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-xl font-medium tracking-tight">
            Groups
          </h2>
          <Link
            href="/groups"
            className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
          >
            All groups
          </Link>
        </div>
        {groupSummaries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No groups yet.{" "}
            <Link
              href="/groups"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Create or join a group
            </Link>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {groupSummaries.map((g) => (
              <li key={g.groupId} className="border-b border-border last:border-0">
                <Link
                  href={`/groups/${g.groupId}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 truncate font-medium">
                    {g.groupName}
                  </span>
                  <Badge
                    className="shrink-0 font-mono"
                    variant={
                      g.balance > 0.01
                        ? "positive"
                        : g.balance < -0.01
                          ? "negative"
                          : "secondary"
                    }
                  >
                    {g.balance > 0.01
                      ? `owed ${formatCurrency(g.balance)}`
                      : g.balance < -0.01
                        ? `owe ${formatCurrency(Math.abs(g.balance))}`
                        : "settled up"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-xl font-medium tracking-tight">
            Recent activity
          </h2>
          <Link
            href="/activity"
            className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No expenses yet.
          </div>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {recentExpenses.map((expense) => (
              <li key={expense.id} className="border-b border-border last:border-0">
                <Link
                  href={`/expenses/${expense.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{expense.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {expense.group.name} · {expense.paidBy.name} ·{" "}
                      {format(expense.expenseDate, "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular font-mono text-sm font-medium">
                      {formatCurrency(decimalToNumber(expense.amount))}
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
