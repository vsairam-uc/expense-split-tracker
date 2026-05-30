import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { auth } from "@/lib/auth";
import { ADMIN_MODELS } from "@/lib/admin/models";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-primary" />
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>

      <nav className="flex flex-wrap gap-1 border-b pb-2" aria-label="Admin sections">
        <Link
          href="/admin"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Overview
        </Link>
        {ADMIN_MODELS.map((model) => (
          <Link
            key={model.key}
            href={`/admin/${model.key}`}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            {model.pluralLabel}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
