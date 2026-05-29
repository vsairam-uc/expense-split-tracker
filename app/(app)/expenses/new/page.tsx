import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ExpenseForm } from "@/components/expense-form";
import { createFriendExpenseAction } from "@/lib/actions/expenses";
import { getFriendsData } from "@/lib/actions/friends";
import { auth } from "@/lib/auth";

export default async function NewFriendExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id;
  const userName = session!.user!.name;
  const { with: withFriendId } = await searchParams;
  const { friends } = await getFriendsData();

  const members = [
    { id: userId, name: `${userName} (you)` },
    ...friends.map((f) => ({ id: f.id, name: f.name })),
  ];

  const preselectedFriend = withFriendId
    ? friends.find((f) => f.id === withFriendId)
    : undefined;
  const defaultParticipantIds = preselectedFriend
    ? [userId, preselectedFriend.id]
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Add expense"
        description="Split an expense with friends — no group needed"
      />

      {friends.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Add friends first</CardTitle>
            <CardDescription>
              You need at least one friend before you can split an expense.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/friends" />}>
              Find friends
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Expense details</CardTitle>
            <CardDescription>
              Choose who paid and who shares the cost. A group is created
              automatically only when needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              members={members}
              currentUserId={userId}
              action={createFriendExpenseAction}
              defaultValues={
                defaultParticipantIds
                  ? { participantIds: defaultParticipantIds }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
