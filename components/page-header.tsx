import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow ?? "Ledger"}
        </p>
        <h1 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          {children}
        </div>
      )}
    </div>
  );
}
