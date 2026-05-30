"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  restoreRecordAction,
  softDeleteRecordAction,
} from "@/lib/actions/admin";

export function RecordRowActions({
  modelKey,
  id,
  isDeleted,
}: {
  modelKey: string;
  id: string;
  isDeleted: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Soft-delete this record? It can be restored later.")) return;
    startTransition(async () => {
      await softDeleteRecordAction(modelKey, id);
    });
  }

  function handleRestore() {
    startTransition(async () => {
      await restoreRecordAction(modelKey, id);
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        size="icon-sm"
        variant="ghost"
        nativeButton={false}
        render={<Link href={`/admin/${modelKey}/${id}`} />}
        aria-label="Edit"
      >
        <Pencil />
      </Button>
      {isDeleted ? (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleRestore}
          disabled={pending}
          aria-label="Restore"
        >
          <RotateCcw />
        </Button>
      ) : (
        <Button
          size="icon-sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Delete"
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
