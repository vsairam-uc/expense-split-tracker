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
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
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

  const leftItems = navItems.filter(
    (item) => item.href === "/dashboard" || item.href === "/groups"
  );
  const rightItems = navItems.filter(
    (item) =>
      item.href === "/activity" ||
      item.href === "/profile" ||
      item.href === "/admin"
  );

  const renderNavItem = (item: typeof baseNavItems[0]) => {
    const active = pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1 text-[10px] transition-colors sm:text-xs",
          active ? "text-foreground font-medium" : "text-muted-foreground"
        )}
      >
        <Icon className="size-5 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

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
            <NotificationBell />
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
        className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-md items-center justify-between rounded-full border border-border bg-background/80 px-2 py-1.5 backdrop-blur-md floating-nav-shadow md:hidden"
        aria-label="Main navigation"
      >
        <div className="flex flex-1 justify-around">
          {leftItems.map(renderNavItem)}
        </div>

        <div className="flex shrink-0 px-2">
          <Link
            href="/expenses/new"
            className="flex size-11 -translate-y-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition-all hover:scale-105 active:scale-95 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            aria-label="Add expense"
          >
            <Plus className="size-6" />
          </Link>
        </div>

        <div className="flex flex-1 justify-around">
          {rightItems.map(renderNavItem)}
        </div>
      </nav>
    </>
  );
}

