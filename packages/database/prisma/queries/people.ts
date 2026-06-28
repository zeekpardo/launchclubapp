import { db } from "../client";

export async function getPeopleByOrganization(
	organizationId: string,
	opts?: {
		personType?: "STUDENT" | "PARENT" | "MENTOR";
		isActive?: boolean;
		query?: string;
		areaId?: string;
		siteId?: string;
		siteIds?: string[];
		groupIds?: string[];
	},
) {
	// Priority: groupIds scope > siteIds scope > siteId/areaId UI filter
	const personGroupsFilter = opts?.groupIds
		? { some: { groupId: { in: opts.groupIds } } }
		: opts?.siteIds
			? { some: { group: { siteId: { in: opts.siteIds } } } }
			: opts?.siteId
				? { some: { group: { siteId: opts.siteId } } }
				: opts?.areaId
					? { some: { group: { site: { areaId: opts.areaId } } } }
					: undefined;

	return db.person.findMany({
		where: {
			organizationId,
			...(opts?.personType !== undefined
				? { personType: opts.personType }
				: {}),
			...(opts?.isActive !== undefined
				? { isActive: opts.isActive }
				: {}),
			...(personGroupsFilter ? { personGroups: personGroupsFilter } : {}),
			...(opts?.query
				? {
						OR: [
							{
								firstName: {
									contains: opts.query,
									mode: "insensitive",
								},
							},
							{
								lastName: {
									contains: opts.query,
									mode: "insensitive",
								},
							},
							{
								email: {
									contains: opts.query,
									mode: "insensitive",
								},
							},
						],
					}
				: {}),
		},
		include: {
			household: true,
			personGroups: { include: { group: true } },
		},
		orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
	});
}

export async function getAllPeople({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return db.person.findMany({
		where: query
			? {
					OR: [
						{ firstName: { contains: query, mode: "insensitive" } },
						{ lastName: { contains: query, mode: "insensitive" } },
						{ email: { contains: query, mode: "insensitive" } },
					],
				}
			: undefined,
		include: { household: { include: { organization: true } } },
		orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
		take: limit,
		skip: offset,
	});
}

export async function countAllPeople({ query }: { query?: string }) {
	return db.person.count({
		where: query
			? {
					OR: [
						{ firstName: { contains: query, mode: "insensitive" } },
						{ lastName: { contains: query, mode: "insensitive" } },
						{ email: { contains: query, mode: "insensitive" } },
					],
				}
			: undefined,
	});
}

export async function getPersonById(id: string) {
	return db.person.findUnique({
		where: { id },
		include: {
			household: true,
			personGroups: { include: { group: { include: { site: true } } } },
			guardianOf: { include: { kid: true } },
			guardians: { include: { person: true } },
		},
	});
}

export async function createPerson(data: {
	organizationId: string;
	householdId?: string | null;
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string;
	dateOfBirth?: Date;
	gender?: string;
	personType?: "STUDENT" | "PARENT" | "MENTOR";
	grade?: string;
	studentId?: string;
	notes?: string;
	allergies?: string;
	medicalNotes?: string;
	avatarUrl?: string;
}) {
	return db.person.create({ data });
}

export async function updatePerson(
	id: string,
	data: Partial<Omit<Parameters<typeof createPerson>[0], "organizationId">>,
) {
	return db.person.update({ where: { id }, data });
}

export async function deletePerson(id: string) {
	return db.person.delete({ where: { id } });
}

export async function addGuardian(
	personId: string,
	kidId: string,
	relation?: string,
) {
	return db.guardian.upsert({
		where: { personId_kidId: { personId, kidId } },
		create: { personId, kidId, relation },
		update: { relation },
	});
}

export async function removeGuardian(personId: string, kidId: string) {
	return db.guardian.delete({
		where: { personId_kidId: { personId, kidId } },
	});
}
