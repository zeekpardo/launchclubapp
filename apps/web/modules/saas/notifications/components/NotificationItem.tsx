"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useRouter } from "@shared/hooks/router";
import { formatDistanceToNow } from "date-fns";
import { AtSignIcon, BellIcon, ShoppingCartIcon } from "lucide-react";
import { useMarkNotificationAsRead } from "../hooks/use-notifications";

type Notification = {
	id: string;
	type: string;
	title: string;
	message: string;
	link: string | null;
	isRead: boolean;
	createdAt: Date;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
	MENTION: <AtSignIcon className="size-4" />,
	APPLICATION_SUBMITTED: <BellIcon className="size-4" />,
	PURCHASE_REQUEST_STATUS_CHANGED: <ShoppingCartIcon className="size-4" />,
};

const TYPE_COLOR: Record<string, string> = {
	MENTION: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
	APPLICATION_SUBMITTED:
		"bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
	PURCHASE_REQUEST_STATUS_CHANGED:
		"bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
};

export function NotificationItem({
	notification,
}: {
	notification: Notification;
}) {
	const { activeOrganization } = useActiveOrganization();
	const router = useRouter();
	const { mutate: markAsRead } = useMarkNotificationAsRead();

	const handleClick = () => {
		if (!notification.isRead) {
			markAsRead({ id: notification.id });
		}
		if (notification.link && activeOrganization?.slug) {
			router.push(`/app/${activeOrganization.slug}${notification.link}`);
		}
	};

	const icon = TYPE_ICON[notification.type] ?? (
		<BellIcon className="size-4" />
	);
	const iconColor =
		TYPE_COLOR[notification.type] ?? "bg-muted text-muted-foreground";

	return (
		<button
			type="button"
			onClick={handleClick}
			className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent"
		>
			<div
				className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${iconColor}`}
			>
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-2">
					<p
						className={`text-sm leading-tight ${notification.isRead ? "font-normal" : "font-semibold"}`}
					>
						{notification.title}
					</p>
					{!notification.isRead && (
						<span className="mt-1 size-2 shrink-0 rounded-full bg-blue-500" />
					)}
				</div>
				<p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
					{notification.message}
				</p>
				<p className="mt-1 text-xs text-muted-foreground/70">
					{formatDistanceToNow(new Date(notification.createdAt), {
						addSuffix: true,
					})}
				</p>
			</div>
		</button>
	);
}
