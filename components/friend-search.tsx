"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sendFriendRequestAction,
  respondFriendRequestAction,
} from "@/lib/actions/friends";

type SearchResult = {
  id: string;
  name: string;
  email: string;
  friendshipStatus: string | null;
  friendshipId: string | null;
  isRequester: boolean;
};

export function FriendSearch({
  onSearch,
}: {
  onSearch: (query: string) => Promise<SearchResult[]>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch() {
    startTransition(async () => {
      const data = await onSearch(query);
      setResults(data);
      setMessage(null);
    });
  }

  function handleSendRequest(userId: string) {
    startTransition(async () => {
      const result = await sendFriendRequestAction(userId);
      setMessage(result.error ?? result.success ?? null);
      if (!result.error) {
        const data = await onSearch(query);
        setResults(data);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          className="min-w-0 flex-1"
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button
          className="w-full shrink-0 sm:w-auto"
          onClick={handleSearch}
          disabled={isPending}
        >
          Search
        </Button>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <ul className="divide-y rounded-lg border">
        {results.map((user) => (
          <li
            key={user.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
            <div className="shrink-0">
              {user.friendshipStatus === "ACCEPTED" ? (
                <span className="text-sm text-muted-foreground">Friends</span>
              ) : user.friendshipStatus === "PENDING" ? (
                <span className="text-sm text-muted-foreground">
                  {user.isRequester ? "Request sent" : "Pending"}
                </span>
              ) : (
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => handleSendRequest(user.id)}
                >
                  {user.friendshipStatus === "DECLINED"
                    ? "Send request"
                    : "Add friend"}
                </Button>
              )}
            </div>
          </li>
        ))}
        {results.length === 0 && query && !isPending && (
          <li className="p-4 text-sm text-muted-foreground">No users found</li>
        )}
      </ul>
    </div>
  );
}

export function FriendRequestActions({ friendshipId }: { friendshipId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex w-full gap-2 sm:w-auto">
      <Button
        size="sm"
        className="flex-1 sm:flex-none"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await respondFriendRequestAction(friendshipId, true);
          })
        }
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await respondFriendRequestAction(friendshipId, false);
          })
        }
      >
        Decline
      </Button>
    </div>
  );
}
