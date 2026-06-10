import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { getFriendDetail } from "@/lib/actions/friends";
import { formatCurrency } from "@/lib/session";

export default async function FriendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getFriendDetail(id);
  if (!detail) notFound();

  const { friend, balance, activities, userId } = detail;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <PageHeader
        eyebrow="Friend"
        title={friend.name}
        description={friend.email ?? undefined}
      >
        <Button
          nativeButton={false}
          render={<Link href={`/expenses/new?with=${friend.id}`} />}
          className="w-full sm:w-auto"
        >
          <Receipt className="size-4" />
          Split expense
        </Button>
      </PageHeader>

      <div className="rounded-lg border border-border p-6">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          {balance > 0.01
            ? `${friend.name} owes you`
            : balance < -0.01
              ? `You owe ${friend.name}`
              : "Settled up"}
        </p>
        <p
          className={`tabular mt-3 font-mono text-3xl font-medium sm:text-4xl ${
            balance > 0.01
              ? "text-positive"
              : balance < -0.01
                ? "text-negative"
                : "text-muted-foreground"
          }`}
        >
          {formatCurrency(Math.abs(balance))}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-medium tracking-tight">
          Activity
        </h2>
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No shared expenses yet.
          </div>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {activities.map((activity) =>
              activity.kind === "expense" ? (
                <li
                  key={`expense-${activity.id}`}
                  className="border-b border-border last:border-0"
                >
                  <Link
                    href={`/expenses/${activity.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {activity.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {format(activity.date, "MMM d, yyyy")} ·{" "}
                        {activity.paidBy.id === userId
                          ? "you"
                          : activity.paidBy.name}{" "}
                        paid · {activity.groupName}
                      </p>
                    </div>
                    <p className="tabular shrink-0 font-mono text-sm font-medium">
                      {formatCurrency(activity.amount)}
                    </p>
                  </Link>
                </li>
              ) : (
                <li
                  key={`settlement-${activity.id}`}
                  className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="font-medium">
                        {activity.fromUser.id === userId
                          ? "You"
                          : activity.fromUser.name}
                      </span>{" "}
                      <span className="text-muted-foreground">paid</span>{" "}
                      <span className="font-medium">
                        {activity.toUser.id === userId
                          ? "you"
                          : activity.toUser.name}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format(activity.date, "MMM d, yyyy")} ·{" "}
                      {activity.groupName}
                    </p>
                  </div>
                  <Badge className="shrink-0 font-mono" variant="secondary">
                    {formatCurrency(activity.amount)}
                  </Badge>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <Link
        href="/dashboard"
        className="inline-block font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
