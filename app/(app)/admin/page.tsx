import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_MODELS } from "@/lib/admin/models";
import { getModelCounts } from "@/lib/actions/admin";

export default async function AdminOverviewPage() {
  const counts = await getModelCounts();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manage the records stored in the database. Deletes are soft (records can
        be restored).
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ADMIN_MODELS.map((model) => (
          <Link key={model.key} href={`/admin/${model.key}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{model.pluralLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {counts[model.key as keyof typeof counts]}
                </p>
                <p className="text-sm text-muted-foreground">total records</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
