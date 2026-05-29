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
    <header className="sticky top-0 z-50 border-b border-teal-200/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-slate-900"
          >
            <span
              className="size-2.5 rounded-full bg-gradient-to-br from-teal-500 to-violet-500"
              aria-hidden
            />
            SplitExpense
          </Link>

          <nav
            className="flex flex-1 flex-wrap items-center justify-center gap-x-5 gap-y-1 px-2"
            aria-label="Landing page sections"
          >
            {sectionLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600"
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
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
                  render={<Link href="/dashboard" />}
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Button>
                <Button
                  nativeButton={false}
                  size="sm"
                  className="gap-1.5 bg-teal-600 text-white hover:bg-teal-700"
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
                  className="text-slate-600 hover:text-teal-700"
                  render={<Link href="/login" />}
                >
                  Sign in
                </Button>
                <Button
                  nativeButton={false}
                  size="sm"
                  className="bg-teal-600 text-white hover:bg-teal-700"
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
