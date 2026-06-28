import { getUnreadCountProcedure } from "./procedures/get-unread-count";
import { listNotificationsProcedure } from "./procedures/list";
import { markAllAsReadProcedure } from "./procedures/mark-all-as-read";
import { markAsReadProcedure } from "./procedures/mark-as-read";

export const notificationsRouter = {
	list: listNotificationsProcedure,
	unreadCount: getUnreadCountProcedure,
	markAsRead: markAsReadProcedure,
	markAllAsRead: markAllAsReadProcedure,
};
