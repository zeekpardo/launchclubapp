import { db } from "../client";

export async function getCustomFieldFoldersByOrg(organizationId: string) {
	return db.customFieldFolder.findMany({
		where: { organizationId },
		orderBy: { order: "asc" },
		include: {
			fields: {
				orderBy: { order: "asc" },
			},
		},
	});
}

export async function createCustomFieldFolder(data: {
	organizationId: string;
	name: string;
	nameEs?: string | null;
	order: number;
}) {
	return db.customFieldFolder.create({ data });
}

export async function updateCustomFieldFolder(
	id: string,
	data: { name?: string; nameEs?: string | null; order?: number },
) {
	return db.customFieldFolder.update({ where: { id }, data });
}

export async function deleteCustomFieldFolder(id: string) {
	// SET NULL on CustomField.folderId is handled by the DB cascade (onDelete: SetNull)
	return db.customFieldFolder.delete({ where: { id } });
}

export async function reorderCustomFieldFolders(
	folders: { id: string; order: number }[],
) {
	return db.$transaction(
		folders.map(({ id, order }) =>
			db.customFieldFolder.update({ where: { id }, data: { order } }),
		),
	);
}
