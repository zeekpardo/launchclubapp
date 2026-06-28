import { db } from "../client";
import type { GpaTerm } from "../generated/enums";

export async function getAcademicRecordsByPerson(personId: string) {
	return db.academicRecord.findMany({
		where: { personId },
		include: { recordedBy: { select: { id: true, name: true } } },
		orderBy: [{ schoolYear: "desc" }, { term: "asc" }],
	});
}

export async function upsertAcademicRecord(data: {
	personId: string;
	schoolYear: string;
	term: GpaTerm;
	termGpa?: number | null;
	cumulativeGpa?: number | null;
	gradeLevel?: string | null;
	gradeScale?: number;
	notes?: string | null;
	recordedById?: string | null;
}) {
	const { personId, schoolYear, term, ...rest } = data;
	return db.academicRecord.upsert({
		where: { personId_schoolYear_term: { personId, schoolYear, term } },
		create: { personId, schoolYear, term, ...rest },
		update: { ...rest },
	});
}

export async function deleteAcademicRecord(id: string, personId: string) {
	// Scope the delete to the person so a record can't be deleted by id alone
	// (the caller is only authorized for this person's organization).
	return db.academicRecord.deleteMany({ where: { id, personId } });
}

export async function getLatestAcademicRecord(personId: string) {
	const records = await db.academicRecord.findMany({
		where: { personId },
		orderBy: [{ schoolYear: "desc" }, { term: "desc" }],
		take: 1,
	});
	return records[0] ?? null;
}

export const TERM_ORDER = [
	"Q1",
	"Q2",
	"Q3",
	"Q4",
	"SEMESTER_1",
	"SEMESTER_2",
	"TRIMESTER_1",
	"TRIMESTER_2",
	"TRIMESTER_3",
	"ANNUAL",
] as const;

export async function getGpaTrendByScope(params: {
	organizationId: string;
	siteId?: string;
	groupId?: string;
	schoolYear: string;
}) {
	const { organizationId, siteId, groupId, schoolYear } = params;

	const rows = await db.academicRecord.groupBy({
		by: ["term"],
		where: {
			schoolYear,
			cumulativeGpa: { not: null },
			person: {
				personType: "STUDENT",
				organizationId,
				...(groupId
					? { personGroups: { some: { groupId } } }
					: siteId
						? { personGroups: { some: { group: { siteId } } } }
						: {}),
			},
		},
		_avg: { cumulativeGpa: true },
		_count: { personId: true },
	});

	// Sort by canonical term order
	return rows
		.map((row) => ({
			term: row.term,
			avgGpa: row._avg.cumulativeGpa ?? 0,
			studentCount: row._count.personId,
		}))
		.sort(
			(a, b) =>
				TERM_ORDER.indexOf(a.term as (typeof TERM_ORDER)[number]) -
				TERM_ORDER.indexOf(b.term as (typeof TERM_ORDER)[number]),
		);
}
