import Link from "next/link";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { FriendRequestActions, FriendSearch } from "@/components/friend-search";
import { getFriendsData, searchUsersAction } from "@/lib/actions/friends";

export default async function FriendsPage() {
  const { friends, pendingIncoming, pendingOutgoing } = await getFriendsData();

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Friends"
        description="Add friends to split expenses with them"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Find friends</CardTitle>
          <CardDescription>
            Search for registered users by name or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FriendSearch onSearch={searchUsersAction} />
        </CardContent>
      </Card>

      {pendingIncoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold sm:text-lg">
            Incoming requests
          </h2>
          <ul className="divide-y rounded-lg border">
            {pendingIncoming.map((req) => (
              <li
                key={req.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
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
          <h2 className="text-base font-semibold sm:text-lg">Sent requests</h2>
          <ul className="divide-y rounded-lg border">
            {pendingOutgoing.map((req) => (
              <li key={req.id} className="p-4">
                <p className="font-medium">{req.addressee.name}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold sm:text-lg">Your friends</h2>
        {friends.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No friends yet. Search above to add someone.
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y rounded-lg border">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{friend.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {friend.email}
                  </p>
                </div>
                <Button
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className="w-full shrink-0 sm:w-auto"
                  render={
                    <Link href={`/expenses/new?with=${friend.id}`} />
                  }
                >
                  <Receipt className="size-4" />
                  Split expense
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
