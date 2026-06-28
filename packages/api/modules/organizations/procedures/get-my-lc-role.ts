import { ORPCError } from "@orpc/client";
import { getUserGroupIds, getUserSiteIds } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const getMyLcRole = protectedProcedure
	.route({
		method: "GET",
		path: "/organizations/{organizationId}/my-role",
		tags: ["Organizations"],
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");

		if (membership.role === "owner") return { lcRole: "owner" as const };
		if (membership.role === "admin") return { lcRole: "admin" as const };

		const siteIds = await getUserSiteIds(context.user.id);
		if (siteIds.length > 0) return { lcRole: "site-leader" as const };

		const groupIds = await getUserGroupIds(context.user.id);
		if (groupIds.length > 0) return { lcRole: "group-leader" as const };

		return { lcRole: "member" as const };
	});
