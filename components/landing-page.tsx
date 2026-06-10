import Link from "next/link";
import { ArrowRight, HandCoins, PieChart, Scale, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing-nav";

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: UsersRound,
    title: "Groups",
    description: "Trip, household, or dinner — one ledger for every bill.",
  },
  {
    icon: PieChart,
    title: "Flexible splits",
    description: "Equal or exact amounts. Everyone pays their share.",
  },
  {
    icon: Scale,
    title: "Live balances",
    description: "See who owes whom across all groups at a glance.",
  },
  {
    icon: HandCoins,
    title: "Settle up",
    description: "Record payments and balances update automatically.",
  },
];

const steps = [
  { label: "Create your account", detail: "Sign up in seconds — no card required." },
  { label: "Add friends & a group", detail: "Invite the people you share costs with." },
  { label: "Log expenses & splits", detail: "Equal or exact, you decide the breakdown." },
  { label: "Settle when you're ready", detail: "Record payments and stay even." },
];

export function LandingPage({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <LandingNav isAuthenticated={isAuthenticated} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="paper-grain pointer-events-none absolute inset-0 opacity-50"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-5xl gap-10 px-5 pb-14 pt-12 sm:gap-12 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Shared expenses, settled
              </p>
              <h1 className="mt-6 font-heading text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
                Split bills fairly.
                <span className="block italic text-muted-foreground">
                  Stay even with everyone.
                </span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                Track who paid what, split your way, and read clear balances like
                a ledger — no spreadsheets, no awkward math.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4 sm:mt-9">
                {isAuthenticated ? (
                  <>
                    <Button
                      size="lg"
                      nativeButton={false}
                      className="w-full sm:w-auto"
                      render={<Link href="/dashboard" />}
                    >
                      Go to dashboard
                      <ArrowRight className="size-4" />
                    </Button>
                    <Link
                      href="/profile"
                      className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                      View your profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      nativeButton={false}
                      className="w-full sm:w-auto"
                      render={<Link href="/register" />}
                    >
                      Get started free
                      <ArrowRight className="size-4" />
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="text-foreground underline-offset-4 hover:underline"
                      >
                        Sign in
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Ledger receipt motif */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-lg border border-border bg-card p-6 shadow-[0_1px_0_var(--border)]">
                <div className="flex items-baseline justify-between border-b border-dashed border-border pb-4">
                  <span className="font-heading text-lg font-medium tracking-tight">
                    Lisbon trip
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    4 people
                  </span>
                </div>
                <ul className="divide-y divide-border text-sm">
                  {[
                    { name: "Dinner at Time Out", who: "Ana paid", amt: "€84.00" },
                    { name: "Tram passes", who: "You paid", amt: "€26.00" },
                    { name: "Pastéis de Belém", who: "Marco paid", amt: "€12.40" },
                  ].map((row) => (
                    <li
                      key={row.name}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.who}</p>
                      </div>
                      <span className="tabular font-mono text-sm">{row.amt}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-4">
                  <span className="text-sm text-muted-foreground">
                    Your balance
                  </span>
                  <span className="tabular font-mono text-base font-medium text-positive">
                    + €30.60
                  </span>
                </div>
              </div>
              <div
                className="absolute -right-3 -top-3 -z-10 size-full rounded-lg border border-border"
                aria-hidden
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="scroll-mt-20 border-t border-border"
        >
          <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-24">
            <div className="flex items-end justify-between gap-6">
              <h2 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
                Built for real-life splitting
              </h2>
              <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground sm:block">
                01 — Features
              </span>
            </div>

            <ul className="mt-10 grid border-l border-t border-border sm:mt-12 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="group border-b border-r border-border p-7 transition-colors hover:bg-muted/40"
                >
                  <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                  <h3 className="mt-5 font-heading text-lg font-medium tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-t border-border bg-muted/30"
        >
          <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-24">
            <div className="flex items-end justify-between gap-6">
              <h2 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
                How it works
              </h2>
              <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground sm:block">
                02 — Flow
              </span>
            </div>
            <ol className="mt-12 border-t border-border">
              {steps.map(({ label, detail }, i) => (
                <li
                  key={label}
                  className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-b border-border py-6 sm:gap-10"
                >
                  <span className="font-mono text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                    <p className="font-heading text-xl font-medium tracking-tight">
                      {label}
                    </p>
                    <p className="text-sm text-muted-foreground sm:max-w-xs sm:text-right">
                      {detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.15em]">
            © {new Date().getFullYear()} Vasool
          </p>
          <nav className="flex flex-wrap justify-center gap-6">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </a>
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
