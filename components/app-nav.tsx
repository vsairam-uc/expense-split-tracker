"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  UsersRound,
  UserCircle,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/lib/actions/auth";

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/groups", label: "Groups", icon: UsersRound },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export function AppNav({
  userName,
  isAdmin = false,
}: {
  userName: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const navItems = isAdmin
    ? [...baseNavItems, { href: "/admin", label: "Admin", icon: Shield }]
    : baseNavItems;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-heading text-lg font-medium tracking-tight"
          >
            <Logo className="size-6" />
            Vasool
          </Link>

          <nav
            className="hidden items-center gap-7 md:flex"
            aria-label="Primary navigation"
          >
            {navItems.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative py-1 text-sm transition-colors hover:text-foreground",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                  {active && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-px bg-foreground" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-[140px] truncate text-sm text-muted-foreground lg:inline">
              {userName}
            </span>
            <ThemeToggle className="text-muted-foreground" />
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-6xl justify-around px-1 py-1.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1.5 text-[10px] transition-colors sm:text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
