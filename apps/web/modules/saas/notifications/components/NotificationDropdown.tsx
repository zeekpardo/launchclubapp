"use client";

import { Button } from "@repo/ui";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import {
	useMarkAllNotificationsAsRead,
	useNotifications,
} from "../hooks/use-notifications";
import { NotificationItem } from "./NotificationItem";

export function NotificationDropdown() {
	const { activeOrganization } = useActiveOrganization();
	const { data: notifications, isLoading } = useNotifications();
	const { mutate: markAllAsRead, isPending } =
		useMarkAllNotificationsAsRead();

	const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

	return (
		<div className="w-80">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<span className="text-sm font-semibold">
					Notifications
					{unreadCount > 0 && (
						<span className="ml-1.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">
							{unreadCount}
						</span>
					)}
				</span>
				{unreadCount > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="h-auto py-1 text-xs"
						disabled={isPending}
						onClick={() =>
							markAllAsRead({
								organizationId: activeOrganization?.id ?? "",
							})
						}
					>
						Mark all as read
					</Button>
				)}
			</div>

			<div className="max-h-80 overflow-y-auto py-1">
				{isLoading ? (
					<div className="px-3 py-8 text-center text-sm text-muted-foreground">
						Loading...
					</div>
				) : !notifications || notifications.length === 0 ? (
					<div className="px-3 py-8 text-center text-sm text-muted-foreground">
						No notifications
					</div>
				) : (
					notifications.map((notification) => (
						<NotificationItem
							key={notification.id}
							notification={notification}
						/>
					))
				)}
			</div>
		</div>
	);
}
