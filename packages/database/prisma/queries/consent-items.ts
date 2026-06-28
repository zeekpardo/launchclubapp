import { db } from "../client";
import type { PersonType } from "../generated/enums";

export async function getConsentItems(organizationId: string) {
	return db.consentItem.findMany({
		where: { organizationId },
		orderBy: { sortOrder: "asc" },
	});
}

export async function getConsentItem(id: string) {
	return db.consentItem.findUnique({
		where: { id },
	});
}

export async function createConsentItem(data: {
	organizationId: string;
	name: string;
	nameES?: string | null;
	pdfKey?: string | null;
	applicantType: PersonType;
	isActive?: boolean;
	sortOrder?: number;
}) {
	return db.consentItem.create({ data });
}

export async function updateConsentItem(
	id: string,
	data: Partial<{
		name: string;
		nameES: string | null;
		pdfKey: string | null;
		applicantType: PersonType;
		isActive: boolean;
		sortOrder: number;
	}>,
) {
	return db.consentItem.update({ where: { id }, data });
}

export async function deleteConsentItem(id: string) {
	return db.consentItem.delete({ where: { id } });
}

export async function reorderConsentItems(
	items: Array<{ id: string; sortOrder: number }>,
) {
	return db.$transaction(
		items.map(({ id, sortOrder }) =>
			db.consentItem.update({ where: { id }, data: { sortOrder } }),
		),
	);
}
