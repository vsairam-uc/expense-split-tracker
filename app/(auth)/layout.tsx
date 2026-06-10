import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col bg-background">
      <div
        className="paper-grain pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-medium tracking-tight"
        >
          <Logo className="size-6" />
          Vasool
        </Link>
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Home
        </Link>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-5 py-12 pb-16 sm:py-16">
        {children}
      </div>
    </div>
  );
}
