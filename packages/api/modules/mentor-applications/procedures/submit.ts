import { ORPCError } from "@orpc/client";
import {
	countRecentMentorApplicationsByEmail,
	createMentorApplication,
	createNotification,
	getAdminUserIdsForOrg,
	getCollectInApplicationFieldsByOrg,
	getOrganizationBySlug,
} from "@repo/database";
import { publicProcedure } from "../../../orpc/procedures";
import { NOTIFICATION_TYPES } from "../../notifications/lib/notification-types";
import { submitMentorApplicationSchema } from "../types";

const ONE_HOUR_MS = 60 * 60 * 1000;
const EMAIL_LIMIT = 5;

export const submitMentorApplication = publicProcedure
	.route({
		method: "POST",
		path: "/mentor-applications/submit",
		tags: ["MentorApplications"],
		summary: "Submit a public mentor application",
	})
	.input(submitMentorApplicationSchema)
	.handler(async ({ input }) => {
		const org = await getOrganizationBySlug(input.orgSlug);
		if (!org) throw new ORPCError("NOT_FOUND");

		// Rate limit per email
		const emailCount = await countRecentMentorApplicationsByEmail(
			input.email,
			ONE_HOUR_MS,
		);
		if (emailCount >= EMAIL_LIMIT) throw new ORPCError("TOO_MANY_REQUESTS");

		// Validate profile field IDs belong to this org
		const validProfileFields = await getCollectInApplicationFieldsByOrg(
			org.id,
		);
		const validProfileFieldIds = new Set(
			validProfileFields.map((f: { id: string }) => f.id),
		);

		// Note: form field validation will be re-scoped to specific mentor Forms in Phase 3.
		// For now, accept any form field values as-is (mentor forms not yet assigned).
		const safeFormFieldValues = input.formFieldValues;
		const safeProfileFieldValues = input.profileFieldValues?.filter((v) =>
			validProfileFieldIds.has(v.customFieldId),
		);

		const {
			orgSlug,
			formFieldValues: _fv,
			profileFieldValues: _pfv,
			...rest
		} = input;

		let result: Awaited<ReturnType<typeof createMentorApplication>>;
		try {
			result = await createMentorApplication({
				organizationId: org.id,
				...rest,
				formFieldValues: safeFormFieldValues?.length
					? safeFormFieldValues
					: undefined,
				profileFieldValues: safeProfileFieldValues?.length
					? safeProfileFieldValues
					: undefined,
			});
		} catch (err: unknown) {
			// Unique constraint violation = duplicate submission — return silently
			if ((err as { code?: string })?.code === "P2002") {
				return { id: "duplicate", status: "PENDING" };
			}
			throw err;
		}

		// Notify org admins
		const adminUserIds = await getAdminUserIdsForOrg(org.id).catch(
			() => [],
		);
		if (adminUserIds.length > 0) {
			const applicantName = `${input.firstName} ${input.lastName}`;
			const nt = NOTIFICATION_TYPES.APPLICATION_SUBMITTED;
			await Promise.allSettled(
				adminUserIds.map((userId) =>
					createNotification({
						organizationId: org.id,
						recipientId: userId,
						type: "APPLICATION_SUBMITTED",
						title: nt.title(),
						message: nt.message(applicantName),
						link: `/mentor-applications/${result.id}`,
						entityType: "application",
						entityId: result.id,
					}),
				),
			);
		}

		return result;
	});
