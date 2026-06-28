import { ORPCError } from "@orpc/client";
import { addUserToGroup, addUserToSite, db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";
import { assertGroupsInOrg, assertSitesInOrg } from "../lib/scope";

export const updateMemberRole = protectedProcedure
	.route({
		method: "PATCH",
		path: "/organizations/{organizationId}/members/{memberId}/role",
		tags: ["Organizations"],
	})
	.input(
		z.object({
			organizationId: z.string(),
			memberId: z.string(),
			lcRole: z.enum(["admin", "member", "site-leader", "group-leader"]),
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

		if (input.lcRole === "site-leader" && input.siteIds.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "At least one site must be selected for a Site Leader",
			});
		}

		if (input.lcRole === "group-leader" && input.groupIds.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "At least one group must be selected for a Group Leader",
			});
		}

		const member = await db.member.findUnique({
			where: { id: input.memberId },
		});

		if (!member || member.organizationId !== input.organizationId) {
			throw new ORPCError("NOT_FOUND");
		}

		// Prevent demoting the owner
		if (member.role === "owner") {
			throw new ORPCError("FORBIDDEN", {
				message: "Cannot change the role of the organization owner",
			});
		}

		const newRole = input.lcRole === "admin" ? "admin" : "member";

		// Update the Better Auth role
		await db.member.update({
			where: { id: input.memberId },
			data: { role: newRole },
		});

		// Replace site assignments for this org
		await db.userSite.deleteMany({
			where: {
				userId: member.userId,
				site: { area: { organizationId: input.organizationId } },
			},
		});

		// Replace group assignments for this org
		await db.userGroup.deleteMany({
			where: {
				userId: member.userId,
				group: { site: { area: { organizationId: input.organizationId } } },
			},
		});

		if (input.lcRole === "site-leader" && input.siteIds.length > 0) {
			await assertSitesInOrg(input.siteIds, input.organizationId);
			await Promise.all(
				input.siteIds.map((siteId) => addUserToSite(member.userId, siteId)),
			);
		}

		if (input.lcRole === "group-leader" && input.groupIds.length > 0) {
			await assertGroupsInOrg(input.groupIds, input.organizationId);
			await Promise.all(
				input.groupIds.map((groupId) => addUserToGroup(member.userId, groupId)),
			);
		}

		return { success: true };
	});
