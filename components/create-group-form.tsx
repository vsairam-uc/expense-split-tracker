"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { createGroupAction } from "@/lib/actions/groups";

type Friend = { id: string; name: string; email: string };

export function CreateGroupForm({
  friends,
  currentUserId,
}: {
  friends: Friend[];
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(createGroupAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a group</CardTitle>
        <CardDescription>
          Add friends who are registered users. You will be added automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state.error && <Alert variant="destructive">{state.error}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="name">Group name</Label>
            <Input id="name" name="name" required placeholder="Roommates, Trip..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>

          <div className="space-y-3">
            <Label>Add members</Label>
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You need friends first.{" "}
                <Link href="/dashboard" className="text-primary underline">
                  Add friends
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                  >
                    <input
                      type="checkbox"
                      name="memberIds"
                      value={friend.id}
                      defaultChecked={friend.id !== currentUserId}
                    />
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {friend.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={pending || friends.length === 0}>
              {pending ? "Creating..." : "Create group"}
            </Button>
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              render={<Link href="/groups" />}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
