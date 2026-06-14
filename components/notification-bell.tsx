"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, Receipt, X, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  type NotificationItem,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: string;
  title: string;
  message: string;
  url: string | null;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef<boolean>(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      const data = await getNotificationsAction();
      if (!data) return;

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);

      // Extract new unread notifications that we haven't seen before
      const newUnreadItems: NotificationItem[] = [];
      data.notifications.forEach((item) => {
        if (!seenNotificationIds.current.has(item.id)) {
          seenNotificationIds.current.add(item.id);
          if (!item.isRead) {
            newUnreadItems.push(item);
          }
        }
      });

      // Only show toasts for new notifications that arrived *after* the initial page load
      if (initialFetchDone.current && newUnreadItems.length > 0) {
        // Trigger shaking animation on the bell
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 800);

        // Add toast alerts
        newUnreadItems.forEach((item) => {
          const newToast: ToastItem = {
            id: item.id,
            title: item.title,
            message: item.message,
            url: item.url,
          };
          setToasts((prev) => [...prev, newToast]);

          // Auto-remove toast after 6 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== item.id));
          }, 6000);
        });
      }

      if (!initialFetchDone.current) {
        initialFetchDone.current = true;
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();

    // Set up polling (every 15 seconds)
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    // Refetch on window focus / tab visibility change
    const handleFocus = () => {
      fetchNotifications(true);
    };

    window.addEventListener("focus", handleFocus);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  // Mark a single notification as read
  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationAsReadAction(item.id);
    }

    if (item.url) {
      router.push(item.url);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsReadAction();
  };

  // Remove a toast manually
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateY(1.5rem) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          15%, 45%, 75% { transform: rotate(-8deg); }
          30%, 60% { transform: rotate(8deg); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:bg-muted/60 hover:text-foreground h-9 w-9 cursor-pointer",
            isShaking && "animate-shake text-primary bg-primary/5"
          )}
          aria-label="View notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[340px] p-0 shadow-xl border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <DropdownMenuLabel className="p-0 font-heading text-base font-semibold">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-2 hover:bg-transparent"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="size-8 text-muted-foreground/40 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">We'll alert you here when new splits are added.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors focus:bg-muted/40",
                    !item.isRead ? "bg-muted/20 font-medium" : ""
                  )}
                >
                  <span className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground",
                    !item.isRead ? "bg-primary/5 border-primary/20 text-primary" : "bg-muted/40"
                  )}>
                    <Receipt className="size-4" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={cn(
                        "text-xs font-semibold truncate",
                        !item.isRead ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 tabular">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: false })} ago
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  {!item.isRead && (
                    <span className="size-1.5 shrink-0 rounded-full bg-primary mt-1.5" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Toast Alert Portal Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[360px] w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.01]"
            style={{
              animation: "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              borderLeft: "3px solid var(--primary)"
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary border border-primary/10">
                  <Receipt className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">{toast.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-normal">{toast.message}</p>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1 hover:bg-muted transition-all"
                aria-label="Dismiss alert"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {toast.url && (
              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-7 px-3 font-semibold shadow-xs"
                  onClick={() => {
                    router.push(toast.url!);
                    removeToast(toast.id);
                  }}
                >
                  View Split details
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
