import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { FriendRequestActions, FriendSearch } from "@/components/friend-search";
import {
  getFriendsDashboardData,
  searchUsersAction,
} from "@/lib/actions/friends";
import { formatCurrency } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const { friends, pendingIncoming, pendingOutgoing, totalOwed, totalOwing } =
    await getFriendsDashboardData();

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Balances and friends, all in one place."
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

      {(() => {
        const netBalance = totalOwed - totalOwing;
        const total = totalOwed + totalOwing;
        const owedPercent = total > 0 ? (totalOwed / total) * 100 : 50;
        const owingPercent = total > 0 ? (totalOwing / total) * 100 : 50;
        
        return (
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                Net Balance
              </p>
              <p
                className={cn(
                  "tabular mt-2 font-mono text-4xl font-semibold sm:text-5xl tracking-tight",
                  netBalance > 0.01
                    ? "text-positive"
                    : netBalance < -0.01
                      ? "text-negative"
                      : "text-muted-foreground"
                )}
              >
                {netBalance > 0.01 ? "+" : netBalance < -0.01 ? "-" : ""}
                {formatCurrency(Math.abs(netBalance))}
              </p>
            </div>

            {total > 0 ? (
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-border rounded-full overflow-hidden flex">
                  <div className="bg-positive h-full transition-all duration-500" style={{ width: `${owedPercent}%` }} />
                  <div className="bg-negative h-full transition-all duration-500" style={{ width: `${owingPercent}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  <span>{owedPercent.toFixed(0)}% Owed</span>
                  <span>{owingPercent.toFixed(0)}% Owing</span>
                </div>
              </div>
            ) : (
              <div className="h-1.5 w-full bg-border/40 rounded-full" />
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/60">
              <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  You are owed
                </p>
                <p className="tabular mt-1.5 font-mono text-xl font-medium text-positive">
                  {formatCurrency(totalOwed)}
                </p>
              </div>
              <div className="border-l border-border/60 pl-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  You owe
                </p>
                <p className="tabular mt-1.5 font-mono text-xl font-medium text-negative">
                  {formatCurrency(totalOwing)}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find friends</CardTitle>
          <CardDescription>
            Search for registered users by name or email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FriendSearch onSearch={searchUsersAction} />
        </CardContent>
      </Card>

      {pendingIncoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Incoming requests
          </h2>
          <ul className="overflow-hidden rounded-lg border border-border">
            {pendingIncoming.map((req) => (
              <li
                key={req.id}
                className="flex flex-col gap-3 border-b border-border p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{req.requester.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {req.requester.email}
                  </p>
                </div>
                <FriendRequestActions friendshipId={req.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {pendingOutgoing.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Sent requests
          </h2>
          <ul className="overflow-hidden rounded-lg border border-border">
            {pendingOutgoing.map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between border-b border-border p-5 last:border-0"
              >
                <p className="font-medium">{req.addressee.name}</p>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Pending
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-medium tracking-tight">
          Your friends
        </h2>
        {friends.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No friends yet. Search above to add someone.
          </div>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex flex-col gap-3 border-b border-border p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/friends/${friend.id}`}
                  className="min-w-0 transition-colors hover:text-foreground"
                >
                  <p className="font-medium">{friend.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {friend.email}
                  </p>
                </Link>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Badge
                    className="shrink-0 font-mono"
                    variant={
                      friend.balance > 0.01
                        ? "positive"
                        : friend.balance < -0.01
                          ? "negative"
                          : "secondary"
                    }
                  >
                    {friend.balance > 0.01
                      ? `owes you ${formatCurrency(friend.balance)}`
                      : friend.balance < -0.01
                        ? `you owe ${formatCurrency(Math.abs(friend.balance))}`
                        : "settled up"}
                  </Badge>
                  <Button
                    nativeButton={false}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    render={<Link href={`/expenses/new?with=${friend.id}`} />}
                  >
                    <Receipt className="size-4" />
                    Split expense
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
