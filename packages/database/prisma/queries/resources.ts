import { db } from "../client";

interface ResourceData {
	groupId: string;
	eventId?: string | null;
	name: string;
	url: string;
	description?: string | null;
}

export async function getResourcesByGroup(groupId: string) {
	return db.groupResource.findMany({
		where: { groupId },
		include: {
			event: { select: { id: true, name: true, startsAt: true } },
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function getResourceById(id: string) {
	return db.groupResource.findUnique({
		where: { id },
		include: { group: { include: { site: { include: { area: true } } } } },
	});
}

export async function createResource(data: ResourceData) {
	return db.groupResource.create({ data });
}

export async function updateResource(
	id: string,
	data: Partial<Omit<ResourceData, "groupId">>,
) {
	return db.groupResource.update({ where: { id }, data });
}

export async function deleteResource(id: string) {
	return db.groupResource.delete({ where: { id } });
}
