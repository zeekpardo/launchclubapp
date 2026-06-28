import { db } from "../client";

export async function createNotification(data: {
	organizationId: string;
	recipientId: string;
	type: string;
	title: string;
	message: string;
	link?: string;
	entityType?: string;
	entityId?: string;
}) {
	return db.notification.create({ data });
}

export async function getNotificationsByUser(
	userId: string,
	organizationId: string,
	limit = 20,
) {
	return db.notification.findMany({
		where: { recipientId: userId, organizationId },
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}

export async function getUnreadNotificationCount(
	userId: string,
	organizationId: string,
): Promise<number> {
	return db.notification.count({
		where: { recipientId: userId, organizationId, isRead: false },
	});
}

export async function markNotificationAsRead(id: string, userId: string) {
	return db.notification.update({
		where: { id, recipientId: userId },
		data: { isRead: true, readAt: new Date() },
	});
}

export async function markAllNotificationsAsRead(
	userId: string,
	organizationId: string,
) {
	return db.notification.updateMany({
		where: { recipientId: userId, organizationId, isRead: false },
		data: { isRead: true, readAt: new Date() },
	});
}
