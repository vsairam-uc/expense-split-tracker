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
    <div className="space-y-10">
      <PageHeader
        eyebrow="People"
        title="Friends"
        description="Add friends to split expenses with them."
      />

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

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
                  render={<Link href={`/expenses/new?with=${friend.id}`} />}
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
