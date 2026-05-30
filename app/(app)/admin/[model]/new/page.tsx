import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordForm } from "@/components/admin/record-form";
import { getAdminModel } from "@/lib/admin/models";
import { createRecordAction } from "@/lib/actions/admin";

export default async function AdminCreatePage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model: modelKey } = await params;
  const model = getAdminModel(modelKey);
  if (!model || !model.canCreate) notFound();

  const fields = model.fields.filter((f) => f.editable);
  const action = createRecordAction.bind(null, modelKey);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New {model.singularLabel.toLowerCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordForm
            fields={fields}
            mode="create"
            action={action}
            cancelHref={`/admin/${modelKey}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
