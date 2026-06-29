import { db } from "../client";
import type { FormStatus, FormType } from "../generated/enums";

export async function createForm(data: {
	organizationId: string;
	slug: string;
	name: string;
	description?: string;
	type: FormType;
	status?: FormStatus;
}) {
	return db.form.create({ data });
}

export async function getFormBySlug(organizationId: string, slug: string) {
	return db.form.findFirst({
		where: { organizationId, slug, deletedAt: null },
		include: {
			fields: {
				orderBy: { order: "asc" },
				include: {
					customField: {
						select: { id: true, type: true, options: true },
					},
					consentItem: {
						select: {
							id: true,
							name: true,
							nameES: true,
							applicantType: true,
							pdfKey: true,
						},
					},
				},
			},
			formSites: {
				include: {
					site: { include: { area: { select: { name: true } } } },
				},
			},
		},
	});
}

export async function getFormsByOrganization(organizationId: string) {
	return db.form.findMany({
		where: { organizationId, deletedAt: null },
		include: {
			_count: { select: { formSites: true, fields: true } },
			formSites: {
				select: { site: { select: { id: true, name: true } } },
			},
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function getFormById(id: string) {
	return db.form.findFirst({
		where: { id, deletedAt: null },
		include: {
			fields: {
				orderBy: { order: "asc" },
				include: {
					customField: {
						select: { id: true, type: true, options: true },
					},
					consentItem: {
						select: {
							id: true,
							name: true,
							nameES: true,
							applicantType: true,
							pdfKey: true,
						},
					},
				},
			},
			formSites: { include: { site: true } },
		},
	});
}

export async function updateForm(
	id: string,
	data: {
		name?: string;
		description?: string;
		status?: FormStatus;
	},
) {
	return db.form.update({ where: { id }, data });
}

export async function softDeleteForm(id: string) {
	return db.form.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function assignSitesToForm(formId: string, siteIds: string[]) {
	return db.$transaction([
		db.formSite.deleteMany({ where: { formId } }),
		db.formSite.createMany({
			data: siteIds.map((siteId) => ({ formId, siteId })),
			skipDuplicates: true,
		}),
	]);
}

export async function getFormSites(formId: string) {
	return db.formSite.findMany({
		where: { formId },
		include: { site: { include: { area: true } } },
		orderBy: { site: { name: "asc" } },
	});
}
