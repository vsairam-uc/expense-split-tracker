import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your shared expenses"
      >
        <Button
          nativeButton={false}
          render={<Link href="/groups" />}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Add expense
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>You are owed</CardDescription>
            <CardTitle className="text-2xl text-green-600 sm:text-3xl">
              {formatCurrency(totalOwed)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>You owe</CardDescription>
            <CardTitle className="text-2xl text-red-600 sm:text-3xl">
              {formatCurrency(totalOwing)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-base font-semibold sm:text-lg">Groups</h2>
        {groupSummaries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground sm:text-base">
              No groups yet.{" "}
              <Link href="/groups" className="text-primary underline">
                Create or join a group
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {groupSummaries.map((g) => (
              <Link key={g.groupId} href={`/groups/${g.groupId}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">{g.groupName}</span>
                    <Badge
                      className="w-fit max-w-full truncate"
                      variant={
                        g.balance > 0.01
                          ? "default"
                          : g.balance < -0.01
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {g.balance > 0.01
                        ? `owed ${formatCurrency(g.balance)}`
                        : g.balance < -0.01
                          ? `owe ${formatCurrency(Math.abs(g.balance))}`
                          : "settled up"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-base font-semibold sm:text-lg">Recent activity</h2>
        {recentExpenses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No expenses yet
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y rounded-lg border">
            {recentExpenses.map((expense) => (
              <li key={expense.id}>
                <Link
                  href={`/expenses/${expense.id}`}
                  className="flex flex-col gap-1 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{expense.description}</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {expense.group.name} · {expense.paidBy.name} ·{" "}
                      {format(expense.expenseDate, "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium sm:text-right">
                    {formatCurrency(decimalToNumber(expense.amount))}
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
