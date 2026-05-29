import Link from "next/link";
import {
  ArrowRight,
  HandCoins,
  PieChart,
  Scale,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing-nav";
import { cn } from "@/lib/utils";

const featureStyles = {
  teal: { icon: "text-teal-600", bg: "bg-teal-100" },
  violet: { icon: "text-violet-600", bg: "bg-violet-100" },
  amber: { icon: "text-amber-600", bg: "bg-amber-100" },
  rose: { icon: "text-rose-600", bg: "bg-rose-100" },
  sky: { icon: "text-sky-600", bg: "bg-sky-100" },
  emerald: { icon: "text-emerald-600", bg: "bg-emerald-100" },
} as const;

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: keyof typeof featureStyles;
}[] = [
  {
    icon: UsersRound,
    title: "Groups",
    description: "Trip, household, or dinner — one place for every bill.",
    accent: "teal",
  },
  {
    icon: PieChart,
    title: "Flexible splits",
    description: "Equal or exact amounts. Everyone pays their share.",
    accent: "violet",
  },
  {
    icon: Scale,
    title: "Live balances",
    description: "See who owes whom across all groups at a glance.",
    accent: "amber",
  },
  {
    icon: HandCoins,
    title: "Settle up",
    description: "Record payments and balances update automatically.",
    accent: "emerald",
  },
  {
    icon: Users,
    title: "Friends",
    description: "Connect and invite people into new groups easily.",
    accent: "sky",
  },
  {
    icon: Wallet,
    title: "Expense history",
    description: "Full split breakdown on every expense, anytime.",
    accent: "rose",
  },
];

const steps = [
  "Create your account",
  "Add friends & a group",
  "Log expenses & splits",
  "Settle when you're ready",
];

const stepColors = ["bg-teal-600", "bg-violet-600", "bg-amber-500", "bg-rose-500"];

export function LandingPage({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  return (
    <div className="landing flex min-h-full flex-col bg-gradient-to-b from-teal-50/80 via-white to-violet-50/50 text-foreground">
      <LandingNav isAuthenticated={isAuthenticated} />

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
          <div
            className="pointer-events-none absolute -top-20 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-teal-300/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-10 top-20 size-56 rounded-full bg-violet-300/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-10 size-40 rounded-full bg-rose-200/30 blur-2xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800 sm:text-sm">
              Shared expenses, simplified
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.15]">
              Split bills fairly.
              <span className="mt-1 block bg-gradient-to-r from-teal-600 via-violet-600 to-rose-500 bg-clip-text text-transparent">
                Stay settled with friends.
              </span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Track who paid what, split your way, and see clear balances — no
              spreadsheets.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {isAuthenticated ? (
                <>
                  <Button
                    size="lg"
                    nativeButton={false}
                    className="w-full bg-teal-600 text-white shadow-md shadow-teal-600/25 hover:bg-teal-700 sm:w-auto"
                    render={<Link href="/dashboard" />}
                  >
                    Go to dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 sm:w-auto"
                    render={<Link href="/profile" />}
                  >
                    Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    nativeButton={false}
                    className="w-full bg-teal-600 text-white shadow-md shadow-teal-600/25 hover:bg-teal-700 sm:w-auto"
                    render={<Link href="/register" />}
                  >
                    Get started free
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    className="w-full border-slate-300 sm:w-auto"
                    render={<Link href="/login" />}
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Built for real-life splitting
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-600 sm:text-base">
              Groups, splits, balances, and settlements — all in one calm place.
            </p>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {features.map(({ icon: Icon, title, description, accent }) => {
                const style = featureStyles[accent];
                return (
                  <li
                    key={title}
                    className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition-shadow hover:shadow-md hover:shadow-teal-100"
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl",
                        style.bg,
                      )}
                    >
                      <Icon className={cn("size-5", style.icon)} />
                    </div>
                    <h3 className="mt-4 font-medium text-slate-900">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-20 border-y border-teal-100 bg-white/60 px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              How it works
            </h2>
            <ol className="mt-10 space-y-0">
              {steps.map((label, i) => (
                <li
                  key={label}
                  className="flex items-start gap-4 border-b border-slate-200/80 py-5 last:border-0"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                      stepColors[i],
                    )}
                  >
                    {i + 1}
                  </span>
                  <p className="pt-1 font-medium text-slate-800">{label}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="get-started"
          className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-2xl text-center">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 via-violet-500 to-rose-500 p-[2px] shadow-lg shadow-violet-200/50">
              <div className="rounded-[14px] bg-white px-6 py-10 sm:px-10 sm:py-12">
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  Ready for your next shared bill?
                </h2>
                <p className="mt-2 text-sm text-slate-600 sm:text-base">
                  Free account · dashboard · split breakdowns on every expense
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  {isAuthenticated ? (
                    <>
                      <Button
                        size="lg"
                        nativeButton={false}
                        className="w-full bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
                        render={<Link href="/dashboard" />}
                      >
                        Dashboard
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        nativeButton={false}
                        className="w-full sm:w-auto"
                        render={<Link href="/profile" />}
                      >
                        Profile
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        nativeButton={false}
                        className="w-full bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
                        render={<Link href="/register" />}
                      >
                        Create account
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        nativeButton={false}
                        className="w-full sm:w-auto"
                        render={<Link href="/login" />}
                      >
                        Sign in
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-teal-100 bg-white/80 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
          <p>© {new Date().getFullYear()} SplitExpense</p>
          <nav className="flex flex-wrap justify-center gap-5">
            <a href="#features" className="hover:text-teal-600">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-teal-600">
              How it works
            </a>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="hover:text-teal-600">
                  Dashboard
                </Link>
                <Link href="/profile" className="font-medium text-teal-600">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-teal-600">
                  Sign in
                </Link>
                <Link href="/register" className="font-medium text-teal-600">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
