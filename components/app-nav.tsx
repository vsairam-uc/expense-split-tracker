"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/groups", label: "Groups", icon: UsersRound },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export function AppNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4">
          <Link
            href="/dashboard"
            className="truncate text-base font-semibold sm:text-lg"
          >
            SplitExpense
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[120px] truncate text-sm text-muted-foreground md:inline lg:max-w-none">
              {userName}
            </span>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-6xl justify-around px-1 py-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors sm:text-xs",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("size-5 shrink-0", active && "text-primary")}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav
        className="sticky top-[53px] z-30 hidden border-b bg-muted/30 md:block"
        aria-label="Desktop navigation"
      >
        <div className="mx-auto flex max-w-6xl gap-1 px-4 py-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                pathname.startsWith(href)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
