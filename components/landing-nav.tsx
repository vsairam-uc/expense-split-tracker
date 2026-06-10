"use client";

import Link from "next/link";
import { LayoutDashboard, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const sectionLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#get-started", label: "Get started" },
];

export function LandingNav({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-baseline gap-2 font-heading text-lg font-medium tracking-tight"
          >
            <span
              className="size-1.5 translate-y-[-2px] rounded-full bg-foreground"
              aria-hidden
            />
            SplitExpense
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-7 px-2 md:flex"
            aria-label="Landing page sections"
          >
            {sectionLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {isAuthenticated ? (
              <>
                <Button
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  render={<Link href="/dashboard" />}
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Button>
                <Button
                  nativeButton={false}
                  size="sm"
                  className="gap-1.5"
                  render={<Link href="/profile" />}
                >
                  <UserCircle className="size-4" />
                  Profile
                </Button>
              </>
            ) : (
              <>
                <Button
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  render={<Link href="/login" />}
                >
                  Sign in
                </Button>
                <Button
                  nativeButton={false}
                  size="sm"
                  render={<Link href="/register" />}
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
