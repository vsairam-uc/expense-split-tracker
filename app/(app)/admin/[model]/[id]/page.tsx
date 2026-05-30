import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecordForm } from "@/components/admin/record-form";
import { getAdminModel } from "@/lib/admin/models";
import { getRecord, updateRecordAction } from "@/lib/actions/admin";

export default async function AdminEditPage({
  params,
}: {
  params: Promise<{ model: string; id: string }>;
}) {
  const { model: modelKey, id } = await params;
  const model = getAdminModel(modelKey);
  if (!model) notFound();

  const record = await getRecord(modelKey, id);
  if (!record) notFound();

  const fields = model.fields.filter((f) => f.editable && !f.createOnly);
  const action = updateRecordAction.bind(null, modelKey, id);
  const isDeleted = Boolean(record.deletedAt);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Edit {model.singularLabel.toLowerCase()}</CardTitle>
            {isDeleted && <Badge variant="destructive">Deleted</Badge>}
          </div>
          <p className="font-mono text-xs text-muted-foreground">{id}</p>
        </CardHeader>
        <CardContent>
          <RecordForm
            fields={fields}
            mode="edit"
            action={action}
            cancelHref={`/admin/${modelKey}`}
            defaultValues={record}
          />
        </CardContent>
      </Card>
    </div>
  );
}
