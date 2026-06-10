import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeftRight, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { getUserActivity } from "@/lib/actions/activity";
import { formatCurrency } from "@/lib/session";

export default async function ActivityPage() {
  const items = await getUserActivity();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="History"
        title="Activity"
        description="Every expense and settlement you're part of."
      />

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No activity yet. Add an expense to get started.
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-border">
          {items.map((item) => {
            const settled = Math.abs(item.net) < 0.01;

            return (
              <li
                key={`${item.kind}-${item.id}`}
                className="border-b border-border last:border-0"
              >
                <Link
                  href={
                    item.kind === "expense"
                      ? `/expenses/${item.id}`
                      : `/groups/${item.groupId}`
                  }
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                    {item.kind === "expense" ? (
                      <Receipt className="size-4" />
                    ) : (
                      <ArrowLeftRight className="size-4" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {item.kind === "expense"
                        ? item.description
                        : item.paidByYou
                          ? `You paid ${item.toName}`
                          : item.receivedByYou
                            ? `${item.fromName} paid you`
                            : `${item.fromName} paid ${item.toName}`}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.kind === "expense"
                        ? `${item.groupName} · ${
                            item.paidByYou ? "You" : item.paidByName
                          } paid ${formatCurrency(item.amount)}`
                        : `${item.groupName} · settlement`}{" "}
                      · {format(item.date, "MMM d, yyyy")}
                    </p>
                  </div>

                  <Badge
                    className="shrink-0 font-mono"
                    variant={
                      settled
                        ? "secondary"
                        : item.net > 0
                          ? "positive"
                          : "negative"
                    }
                  >
                    {settled
                      ? "settled"
                      : item.net > 0
                        ? `+${formatCurrency(item.net)}`
                        : `-${formatCurrency(Math.abs(item.net))}`}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
