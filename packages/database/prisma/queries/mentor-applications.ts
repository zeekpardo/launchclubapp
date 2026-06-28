import { db } from "../client";

export async function createMentorApplication(data: {
	organizationId: string;
	siteId?: string;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	addressLine1?: string;
	city?: string;
	stateProvince?: string;
	postalCode?: string;
	country?: string;
	mentorContractFileUrl?: string;
	mentorSecurityClearanceFileUrl?: string;
	formFieldValues?: { formFieldId: string; value: string }[];
	profileFieldValues?: { customFieldId: string; value: string }[];
}) {
	const { formFieldValues, profileFieldValues, ...rest } = data;
	return db.mentorApplication.create({
		data: {
			...rest,
			formFieldValues: formFieldValues?.length
				? { create: formFieldValues }
				: undefined,
			profileFieldValues: profileFieldValues?.length
				? { create: profileFieldValues }
				: undefined,
		},
		include: {
			formFieldValues: true,
			profileFieldValues: true,
			organization: true,
			site: true,
		},
	});
}

export async function getMentorApplicationById(id: string) {
	return db.mentorApplication.findUnique({
		where: { id },
		include: {
			organization: true,
			site: true,
			formFieldValues: { include: { formField: true } },
			profileFieldValues: { include: { customField: true } },
		},
	});
}

export async function getMentorApplicationsByOrganization(
	organizationId: string,
	status?: string,
) {
	return db.mentorApplication.findMany({
		where: {
			organizationId,
			...(status ? { status } : {}),
		},
		include: { site: true },
		orderBy: { createdAt: "desc" },
	});
}

// Site-scoped variant for site leaders — only mentor applications tied to a
// site the user is assigned to (org-level mentor apps with no site are omitted).
export async function getMentorApplicationsByUserSites(
  userId: string,
  status?: string,
) {
  return db.mentorApplication.findMany({
    where: {
      site: { userSites: { some: { userId } } },
      ...(status ? { status } : {}),
    },
    include: { site: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function countRecentMentorApplicationsByEmail(
	email: string,
	windowMs: number,
) {
	return db.mentorApplication.count({
		where: {
			email,
			createdAt: { gte: new Date(Date.now() - windowMs) },
		},
	});
}

export async function reviewMentorApplication(
	id: string,
	status: string,
	reviewedBy: string,
	assignedGroupId?: string | null,
) {
	return db.mentorApplication.update({
		where: { id },
		data: {
			status,
			reviewedAt: new Date(),
			reviewedBy,
			...(assignedGroupId !== undefined ? { assignedGroupId } : {}),
		},
		include: {
			organization: true,
			site: true,
			formFieldValues: { include: { formField: true } },
		},
	});
}
