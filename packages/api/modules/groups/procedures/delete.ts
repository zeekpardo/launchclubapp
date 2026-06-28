import { ORPCError } from "@orpc/client";
import {
	deleteGroup,
	getAreaById,
	getGroupById,
	getSiteById,
	getUserSiteIds,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";

export const deleteGroupProcedure = protectedProcedure
	.route({ method: "DELETE", path: "/groups/{id}", tags: ["Groups"] })
	.input(z.object({ id: z.string() }))
	.handler(async ({ input, context }) => {
		const group = await getGroupById(input.id);
		if (!group) throw new ORPCError("NOT_FOUND");
		const site = await getSiteById(group.siteId);
		if (!site) throw new ORPCError("NOT_FOUND");
		const area = await getAreaById(site.areaId);
		if (!area) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			area.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) {
			// Only site leaders can delete groups
			const userSiteIds = await getUserSiteIds(context.user.id);
			if (userSiteIds.length === 0) throw new ORPCError("FORBIDDEN");
			if (!(await canAccessSite(context.user.id, group.siteId)))
				throw new ORPCError("FORBIDDEN");
		}
		await deleteGroup(input.id);
		return { success: true };
	});
