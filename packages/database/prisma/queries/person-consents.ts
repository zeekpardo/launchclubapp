import { db } from "../client";

export async function getPersonConsents(
	personId: string,
	academicYearId: string,
) {
	return db.personConsent.findMany({
		where: { personId, academicYearId },
		include: { consentItem: true },
		orderBy: { consentItem: { sortOrder: "asc" } },
	});
}

export async function upsertPersonConsent(data: {
	personId: string;
	academicYearId: string;
	consentItemId: string;
	granted: boolean;
	grantedAt?: Date | null;
	signatureFileUrl?: string | null;
}) {
	const { personId, academicYearId, consentItemId, ...rest } = data;
	return db.personConsent.upsert({
		where: {
			personId_academicYearId_consentItemId: {
				personId,
				academicYearId,
				consentItemId,
			},
		},
		create: { personId, academicYearId, consentItemId, ...rest },
		update: { ...rest },
	});
}

export async function getPreviousYearConsents(personId: string, orgId: string) {
	// Find the most recent non-active academic year for the org that has at least one PersonConsent for this person
	const year = await db.academicYear.findFirst({
		where: {
			organizationId: orgId,
			isActive: false,
			personConsents: { some: { personId } },
		},
		orderBy: { label: "desc" },
		include: {
			personConsents: {
				where: { personId },
				include: { consentItem: true },
				orderBy: { consentItem: { sortOrder: "asc" } },
			},
		},
	});

	if (!year) return null;

	const { personConsents, ...academicYear } = year;
	return { academicYear, consents: personConsents };
}
