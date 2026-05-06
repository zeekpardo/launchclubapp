import { listNotificationsProcedure } from "./procedures/list";
import { getUnreadCountProcedure } from "./procedures/get-unread-count";
import { markAsReadProcedure } from "./procedures/mark-as-read";
import { markAllAsReadProcedure } from "./procedures/mark-all-as-read";

export const notificationsRouter = {
  list: listNotificationsProcedure,
  unreadCount: getUnreadCountProcedure,
  markAsRead: markAsReadProcedure,
  markAllAsRead: markAllAsReadProcedure,
};
