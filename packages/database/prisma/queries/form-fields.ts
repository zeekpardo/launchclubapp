import { db } from "../client";
import type { FormFieldType, PersonType } from "../generated/enums";

export async function getFormFields(formId: string) {
	return db.formField.findMany({
		where: { formId },
		orderBy: { order: "asc" },
	});
}

export async function createFormField(data: {
	formId: string;
	label: string;
	fieldKey: string;
	type: FormFieldType;
	placeholder?: string;
	helpText?: string;
	required?: boolean;
	options?: { label: string; value: string }[];
	validation?: { minLength?: number; maxLength?: number; pattern?: string };
	profileFieldKey?: string;
	customFieldId?: string;
	targetPersonType?: PersonType;
	consentItemId?: string;
}) {
	const count = await db.formField.count({ where: { formId: data.formId } });

	return db.formField.create({
		data: {
			...data,
			order: count + 1,
			options: data.options ?? undefined,
			validation: data.validation ?? undefined,
		},
	});
}

export async function updateFormField(
	id: string,
	data: {
		label?: string;
		fieldKey?: string;
		type?: FormFieldType;
		placeholder?: string;
		helpText?: string;
		required?: boolean;
		options?: { label: string; value: string }[];
		validation?: {
			minLength?: number;
			maxLength?: number;
			pattern?: string;
		};
		profileFieldKey?: string;
		customFieldId?: string | null;
		targetPersonType?: PersonType | null;
		consentItemId?: string | null;
	},
) {
	return db.formField.update({
		where: { id },
		data: {
			...data,
			options: data.options ?? undefined,
			validation: data.validation ?? undefined,
		},
	});
}

export async function deleteFormField(id: string) {
	return db.formField.delete({ where: { id } });
}

export async function reorderFormFields(ids: string[]) {
	return db.$transaction(
		ids.map((id, index) =>
			db.formField.update({
				where: { id },
				data: { order: index + 1 },
			}),
		),
	);
}

/**
 * Returns all form fields from Forms assigned to a given site via FormSite.
 * Used to validate submitted field IDs on application submit.
 */
export async function getFormFieldsForSite(siteId: string) {
	const formSites = await db.formSite.findMany({
		where: {
			siteId,
			form: { deletedAt: null, status: "PUBLISHED" },
		},
		include: {
			form: { include: { fields: { orderBy: { order: "asc" } } } },
		},
	});
	return formSites.flatMap((fs) => fs.form.fields);
}

/**
 * Returns all form fields from Forms assigned to a site looked up by slug.
 * Convenience wrapper for public-facing apply pages.
 */
export async function getFormFieldsBySiteSlug(siteSlug: string) {
	const formSites = await db.formSite.findMany({
		where: {
			site: { slug: siteSlug },
			form: { deletedAt: null, status: "PUBLISHED" },
		},
		include: {
			form: { include: { fields: { orderBy: { order: "asc" } } } },
		},
	});
	return formSites.flatMap((fs) => fs.form.fields);
}
