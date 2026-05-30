import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RecordRowActions } from "@/components/admin/record-row-actions";
import { getAdminModel, type AdminField } from "@/lib/admin/models";
import { listRecords } from "@/lib/actions/admin";

function formatValue(field: AdminField, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "boolean") {
    return value === true || value === "true" ? "Yes" : "No";
  }
  if (field.type === "select" && field.options) {
    return field.options.find((o) => o.value === value)?.label ?? String(value);
  }
  if (field.type === "date") {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString();
  }
  const str = String(value);
  return str.length > 40 ? `${str.slice(0, 37)}…` : str;
}

export default async function AdminListPage({
  params,
  searchParams,
}: {
  params: Promise<{ model: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { model: modelKey } = await params;
  const { page: pageParam, q } = await searchParams;

  const model = getAdminModel(modelKey);
  if (!model) notFound();

  const page = Number(pageParam) || 1;
  const { rows, total, pageCount } = await listRecords(modelKey, {
    page,
    search: q,
  });

  const columns = model.fields.filter((f) => f.listColumn);
  const buildPageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const query = sp.toString();
    return `/admin/${modelKey}${query ? `?${query}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{model.pluralLabel}</h2>
          <p className="text-sm text-muted-foreground">{total} records</p>
        </div>
        {model.canCreate && (
          <Button
            nativeButton={false}
            render={<Link href={`/admin/${modelKey}/new`} />}
          >
            <Plus />
            New {model.singularLabel.toLowerCase()}
          </Button>
        )}
      </div>

      {model.searchFields.length > 0 && (
        <form className="flex gap-2" action={`/admin/${modelKey}`}>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder={`Search ${model.pluralLabel.toLowerCase()}...`}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="px-3 py-2 text-left font-medium whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No records found
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isDeleted = Boolean(row.deletedAt);
                return (
                  <tr
                    key={String(row.id)}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.name}
                        className="px-3 py-2 whitespace-nowrap"
                      >
                        {formatValue(col, row[col.name])}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      {isDeleted ? (
                        <Badge variant="destructive">Deleted</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <RecordRowActions
                        modelKey={modelKey}
                        id={String(row.id)}
                        isDeleted={isDeleted}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            nativeButton={false}
            render={<Link href={buildPageHref(page - 1)} />}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            nativeButton={false}
            render={<Link href={buildPageHref(page + 1)} />}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
