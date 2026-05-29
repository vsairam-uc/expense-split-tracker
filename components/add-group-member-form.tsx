"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addGroupMemberAction } from "@/lib/actions/groups";

type Friend = { id: string; name: string };

export function AddGroupMemberForm({
  groupId,
  friendsNotInGroup,
}: {
  groupId: string;
  friendsNotInGroup: Friend[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState("");

  if (friendsNotInGroup.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <Select value={selectedId} onValueChange={(v) => v && setSelectedId(v)}>
        <SelectTrigger className="w-full sm:min-w-[200px]">
          <SelectValue placeholder="Add a friend..." />
        </SelectTrigger>
        <SelectContent>
          {friendsNotInGroup.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={!selectedId || isPending}
        onClick={() =>
          startTransition(async () => {
            await addGroupMemberAction(groupId, selectedId);
            setSelectedId("");
          })
        }
      >
        {isPending ? "Adding..." : "Add member"}
      </Button>
    </div>
  );
}
