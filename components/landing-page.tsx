"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, HandCoins, PieChart, Scale, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing-nav";
import { cn } from "@/lib/utils";

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
  const [demoAmount, setDemoAmount] = useState("120.00");
  const [demoPayer, setDemoPayer] = useState<"You" | "Ana" | "Marco">("You");
  const [demoParticipants, setDemoParticipants] = useState<string[]>(["You", "Ana", "Marco"]);

  const amountNum = Number(demoAmount) || 0;
  const participantCount = demoParticipants.length;
  
  const members = [
    { key: "Ana", name: "Ana" },
    { key: "You", name: "You" },
    { key: "Marco", name: "Marco" },
  ];
  
  const spentShare = participantCount > 0 ? amountNum / participantCount : 0;
  
  const balances = members.map(m => {
    const isParticipant = demoParticipants.includes(m.key);
    const paid = demoPayer === m.key ? amountNum : 0;
    const spent = isParticipant ? spentShare : 0;
    const balance = paid - spent;
    return { ...m, paid, spent, balance };
  });

  // Calculate settlement path
  const settlements: string[] = [];
  const debtors = balances.filter(b => b.balance < -0.01).map(b => ({ ...b, balance: Math.abs(b.balance) }));
  const creditors = balances.filter(b => b.balance > 0.01).map(b => ({ ...b, balance: b.balance }));

  let dIdx = 0;
  let cIdx = 0;
  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const amountToClear = Math.min(debtor.balance, creditor.balance);
    
    settlements.push(`${debtor.name} owes ${creditor.name}: €${amountToClear.toFixed(2)}`);
    
    debtor.balance -= amountToClear;
    creditor.balance -= amountToClear;
    
    if (debtor.balance < 0.01) dIdx++;
    if (creditor.balance < 0.01) cIdx++;
  }

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
                      className="w-full sm:w-auto cursor-pointer"
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
                      className="w-full sm:w-auto cursor-pointer"
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

            {/* Interactive Sandbox Receipt Motif */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-lg border border-border bg-card p-6 shadow-xs glass-card">
                <div className="flex flex-col gap-4 border-b border-dashed border-border pb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-lg font-medium tracking-tight">
                      Lisbon trip
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2 py-0.5 border border-border/80 rounded bg-background/50">
                      Sandbox
                    </span>
                  </div>
                  
                  {/* Sandbox Controls */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Amount (€)</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={demoAmount}
                        onChange={(e) => setDemoAmount(e.target.value)}
                        className="rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-sm focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Paid By</span>
                      <select
                        value={demoPayer}
                        onChange={(e) => setDemoPayer(e.target.value as any)}
                        className="rounded-md border border-border bg-background/60 px-2 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground"
                      >
                        <option value="You">You</option>
                        <option value="Ana">Ana</option>
                        <option value="Marco">Marco</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold font-mono">Participants</span>
                  <div className="mt-1 flex gap-2">
                    {members.map(m => {
                      const isChecked = demoParticipants.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          onClick={() => {
                            setDemoParticipants(prev =>
                              prev.includes(m.key) ? prev.filter(p => p !== m.key) : [...prev, m.key]
                            );
                          }}
                          className={cn(
                            "flex-1 py-1 px-1.5 text-xs rounded-md border text-center transition-all cursor-pointer",
                            isChecked
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-medium"
                              : "bg-background/40 border-border text-muted-foreground hover:bg-muted/30"
                          )}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <ul className="divide-y divide-border text-sm mt-4">
                  {balances.map((row) => (
                    <li
                      key={row.key}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Paid: €{row.paid.toFixed(2)} · Spent: €{row.spent.toFixed(2)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "tabular font-mono text-sm font-medium",
                          row.balance > 0.01
                            ? "text-positive"
                            : row.balance < -0.01
                              ? "text-negative"
                              : "text-muted-foreground"
                        )}
                      >
                        {row.balance > 0.01 ? "+" : ""}
                        €{row.balance.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 border-t border-dashed border-border pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Total Spent</span>
                    <span className="font-mono">€{amountNum.toFixed(2)}</span>
                  </div>
                  
                  {settlements.length > 0 ? (
                    <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground space-y-1 font-mono">
                      {settlements.map((s, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2.5 text-xs text-muted-foreground font-mono">
                      Everyone is settled up
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stacked sheets of paper layout */}
              <div
                className="absolute -right-2 -bottom-2 -z-10 size-full rounded-lg border border-border bg-card/60"
                aria-hidden
              />
              <div
                className="absolute -right-4 -bottom-4 -z-20 size-full rounded-lg border border-border/60 bg-card/30"
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
