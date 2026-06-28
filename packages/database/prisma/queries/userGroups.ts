import { db } from "../client";

export async function addUserToGroup(userId: string, groupId: string) {
	return db.userGroup.upsert({
		where: { userId_groupId: { userId, groupId } },
		create: { userId, groupId },
		update: {},
	});
}

export async function removeUserFromGroup(userId: string, groupId: string) {
	return db.userGroup.delete({
		where: { userId_groupId: { userId, groupId } },
	});
}

export async function getUserGroupIdsByUser(userId: string): Promise<string[]> {
	const rows = await db.userGroup.findMany({
		where: { userId },
		select: { groupId: true },
	});
	return rows.map((r) => r.groupId);
}
