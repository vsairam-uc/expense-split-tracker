import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Plus, HandCoins } from "lucide-react";
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
import { AddGroupMemberForm } from "@/components/add-group-member-form";
import { getFriendsData } from "@/lib/actions/friends";
import { getGroupDetail } from "@/lib/actions/groups";
import { getGroupBalanceData } from "@/lib/group-balances";
import { auth } from "@/lib/auth";
import { formatCurrency, decimalToNumber } from "@/lib/session";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id;

  const [group, balanceData, { friends }] = await Promise.all([
    getGroupDetail(id),
    getGroupBalanceData(id),
    getFriendsData(),
  ]);

  if (!group || !balanceData) notFound();

  const { simplifiedDebts, members, netBalances } = balanceData;
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const memberIds = new Set(members.map((m) => m.id));
  const friendsNotInGroup = friends
    .filter((f) => !memberIds.has(f.id))
    .map((f) => ({ id: f.id, name: f.name }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={group.name}
        description={group.description ?? undefined}
      >
        <Button
          nativeButton={false}
          render={<Link href={`/groups/${id}/expenses/new`} />}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Add expense
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/groups/${id}/settle`} />}
          className="w-full sm:w-auto"
        >
          <HandCoins className="size-4" />
          Settle up
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Balances</CardTitle>
            <CardDescription>Simplified debts in this group</CardDescription>
          </CardHeader>
          <CardContent>
            {simplifiedDebts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Everyone is settled up
              </p>
            ) : (
              <ul className="space-y-3">
                {simplifiedDebts.map((debt, i) => (
                  <li
                    key={i}
                    className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">
                        {memberMap.get(debt.fromUserId)}
                      </span>{" "}
                      <span className="text-muted-foreground">owes</span>{" "}
                      <span className="font-medium">
                        {memberMap.get(debt.toUserId)}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatCurrency(debt.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members</CardTitle>
            {!group.isPersonal && friendsNotInGroup.length > 0 && (
              <CardDescription>Add friends to this group</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!group.isPersonal && (
              <AddGroupMemberForm
                groupId={id}
                friendsNotInGroup={friendsNotInGroup}
              />
            )}
            <ul className="space-y-3">
              {members.map((member) => {
                const balance = netBalances.get(member.id) ?? 0;
                return (
                  <li
                    key={member.id}
                    className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0">
                      {member.name}
                      {member.id === userId && (
                        <span className="ml-1 text-muted-foreground">(you)</span>
                      )}
                    </span>
                    <Badge variant="secondary" className="w-fit">
                      {balance > 0.01
                        ? `+${formatCurrency(balance)}`
                        : balance < -0.01
                          ? `-${formatCurrency(Math.abs(balance))}`
                          : "settled"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-base font-semibold sm:text-lg">Expenses</h2>
        {group.expenses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No expenses yet
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y rounded-lg border">
            {group.expenses.map((expense) => (
              <li key={expense.id}>
                <Link
                  href={`/expenses/${expense.id}`}
                  className="flex flex-col gap-2 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{expense.description}</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {format(expense.expenseDate, "MMM d, yyyy")} ·{" "}
                      {expense.paidBy.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <p className="font-medium">
                      {formatCurrency(decimalToNumber(expense.amount))}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {expense.splitType.toLowerCase()}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {group.settlements.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-base font-semibold sm:text-lg">Settlements</h2>
          <ul className="divide-y rounded-lg border">
            {group.settlements.map((s) => (
              <li key={s.id} className="p-4 text-sm">
                <p>
                  <span className="font-medium">{s.fromUser.name}</span> paid{" "}
                  <span className="font-medium">{s.toUser.name}</span>{" "}
                  <span className="font-medium">
                    {formatCurrency(decimalToNumber(s.amount))}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  {format(s.settledAt, "MMM d, yyyy")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
