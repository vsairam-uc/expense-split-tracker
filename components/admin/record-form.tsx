"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import type { AdminField } from "@/lib/admin/models";
import type { ActionState } from "@/lib/actions/auth";

type RecordFormProps = {
  fields: AdminField[];
  mode: "create" | "edit";
  cancelHref: string;
  action: (
    prevState: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  defaultValues?: Record<string, string | number | boolean | null>;
};

function toInputValue(field: AdminField, raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (field.type === "date") {
    const date = new Date(String(raw));
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  }
  if (field.type === "boolean") {
    return raw === true || raw === "true" ? "true" : "false";
  }
  return String(raw);
}

export function RecordForm({
  fields,
  mode,
  cancelHref,
  action,
  defaultValues,
}: RecordFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();

  const selectClass =
    "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      {state.success && <Alert>{state.success}</Alert>}

      {fields.map((field) => {
        const value = toInputValue(field, defaultValues?.[field.name]);
        const required =
          field.required ||
          (field.name === "password" && mode === "create");
        const id = `field-${field.name}`;

        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={id}>
              {field.label}
              {required && <span className="text-destructive"> *</span>}
            </Label>

            {field.type === "select" || field.type === "boolean" ? (
              <select
                id={id}
                name={field.name}
                defaultValue={value}
                required={required}
                className={selectClass}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={id}
                name={field.name}
                type={
                  field.type === "date"
                    ? "date"
                    : field.type === "number"
                      ? "number"
                      : field.type === "email"
                        ? "email"
                        : field.type === "password"
                          ? "password"
                          : "text"
                }
                step={field.type === "number" ? "0.01" : undefined}
                defaultValue={field.type === "password" ? undefined : value}
                required={required}
                placeholder={field.type === "password" && mode === "edit" ? "Leave blank to keep current" : undefined}
              />
            )}

            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );
      })}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
