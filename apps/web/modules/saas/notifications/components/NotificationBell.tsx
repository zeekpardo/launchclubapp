"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  cn,
} from "@repo/ui";
import { BellIcon } from "lucide-react";
import { useUnreadNotificationCount } from "../hooks/use-notifications";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell({
  navMode = false,
  collapsed = false,
}: {
  navMode?: boolean;
  collapsed?: boolean;
}) {
  const { data } = useUnreadNotificationCount();
  const unreadCount = data?.count ?? 0;

  if (navMode) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center border border-transparent gap-3 whitespace-nowrap rounded-lg px-3 py-2 transition-colors hover:bg-muted/50",
              { "justify-center px-2": collapsed },
            )}
          >
            <span className="relative shrink-0">
              <BellIcon className="size-4 text-muted-foreground opacity-60" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
              )}
            </span>
            {!collapsed && (
              <span className="text-muted-foreground">Notifications</span>
            )}
            {!collapsed && unreadCount > 0 && (
              <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white leading-none">
                {unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="p-0">
          <NotificationDropdown />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <BellIcon className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-0">
        <NotificationDropdown />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
