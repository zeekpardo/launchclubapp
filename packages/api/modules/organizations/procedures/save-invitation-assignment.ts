import { ORPCError } from "@orpc/client";
import { saveInvitationRoleAssignment } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const saveInvitationAssignment = protectedProcedure
	.route({
		method: "POST",
		path: "/organizations/{organizationId}/invitation-assignments",
		tags: ["Organizations"],
	})
	.input(
		z.object({
			organizationId: z.string(),
			invitationId: z.string(),
			lcRole: z.enum(["admin", "site-leader", "group-leader"]),
			siteIds: z.array(z.string()).default([]),
			groupIds: z.array(z.string()).default([]),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);

		const isOrgAdmin =
			membership && ["owner", "admin"].includes(membership.role);
		const isPlatformAdmin = context.user.role === "admin";

		if (!isOrgAdmin && !isPlatformAdmin) {
			throw new ORPCError("FORBIDDEN");
		}

		await saveInvitationRoleAssignment({
			invitationId: input.invitationId,
			lcRole: input.lcRole,
			siteIds: input.siteIds,
			groupIds: input.groupIds,
		});

		return { success: true };
	});
