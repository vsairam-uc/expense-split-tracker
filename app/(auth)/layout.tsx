import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 pb-12 sm:py-12">
        {children}
      </div>
    </div>
  );
}
