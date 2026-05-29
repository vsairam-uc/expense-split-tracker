import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettlementForm } from "@/components/settlement-form";
import { getGroupDetail } from "@/lib/actions/groups";
import { getGroupBalanceData } from "@/lib/group-balances";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/session";

export default async function SettlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id;

  const [group, balanceData] = await Promise.all([
    getGroupDetail(id),
    getGroupBalanceData(id),
  ]);
  if (!group || !balanceData) notFound();

  const members = balanceData.members.map((m) => ({
    id: m.id,
    name: m.name,
  }));
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settle up</h1>
        <p className="text-muted-foreground">In {group.name}</p>
      </div>

      {balanceData.simplifiedDebts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested payments</CardTitle>
            <CardDescription>
              Based on simplified balances in this group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {balanceData.simplifiedDebts.map((debt, i) => (
                <li key={i}>
                  {memberMap.get(debt.fromUserId)} owes{" "}
                  {memberMap.get(debt.toUserId)}{" "}
                  <span className="font-medium">
                    {formatCurrency(debt.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Record a payment</CardTitle>
        </CardHeader>
        <CardContent>
          <SettlementForm
            groupId={id}
            members={members}
            currentUserId={userId}
            suggestedDebts={balanceData.simplifiedDebts}
          />
        </CardContent>
      </Card>

      <Link href={`/groups/${id}`} className="text-sm text-primary underline">
        Back to group
      </Link>
    </div>
  );
}
