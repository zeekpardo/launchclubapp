import { db } from "../client";

export async function getOrgApplicationSettings(organizationId: string) {
	return db.organizationApplicationSettings.findUnique({
		where: { organizationId },
	});
}

export async function upsertOrgApplicationSettings(
	organizationId: string,
	data: {
		autoMigrate?: boolean;
		emailNotifications?: boolean;
		studentIdMode?: string;
		mentorContractUrl?: string | null;
		mentorSecurityClearanceUrl?: string | null;
		showMentorContract?: boolean;
		showMentorSecurityClearance?: boolean;
		enableMentorDocumentUpload?: boolean;
	},
) {
	return db.organizationApplicationSettings.upsert({
		where: { organizationId },
		create: { organizationId, ...data },
		update: data,
	});
}
