import Link from "next/link";
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
import { getGroupsData } from "@/lib/actions/groups";
import { getUserDashboardBalances } from "@/lib/group-balances";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/session";

export default async function GroupsPage() {
  const session = await auth();
  const groups = await getGroupsData();
  const { groupSummaries } = await getUserDashboardBalances(session!.user!.id);
  const balanceMap = new Map(groupSummaries.map((g) => [g.groupId, g.balance]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        description="Manage expense groups with friends"
      >
        <Button
          nativeButton={false}
          render={<Link href="/groups/new" />}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          New group
        </Button>
      </PageHeader>

      {groups.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No groups yet</CardTitle>
            <CardDescription>
              Create a group to start tracking shared expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/groups/new" />}
              className="w-full sm:w-auto"
            >
              Create your first group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const balance = balanceMap.get(group.id) ?? 0;
            return (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.isPersonal && (
                        <Badge variant="secondary">Personal</Badge>
                      )}
                    </div>
                    {group.description && (
                      <CardDescription className="line-clamp-2">
                        {group.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {group.members.length} members · {group._count.expenses}{" "}
                      expenses
                    </p>
                    <Badge
                      className="max-w-full truncate"
                      variant={
                        balance > 0.01
                          ? "default"
                          : balance < -0.01
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {balance > 0.01
                        ? `owed ${formatCurrency(balance)}`
                        : balance < -0.01
                          ? `owe ${formatCurrency(Math.abs(balance))}`
                          : "settled up"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
