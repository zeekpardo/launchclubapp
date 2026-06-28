import { ORPCError } from "@orpc/client";
import {
	getAreaById,
	getGroupById,
	getSiteById,
	getUserSiteIds,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import {
	canAccessSite,
	canManageGroup,
} from "../../organizations/lib/site-access";

export const getGroup = protectedProcedure
	.route({ method: "GET", path: "/groups/{id}", tags: ["Groups"] })
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
		// owner, LC admin (member.role="admin"), or platform admin: full access
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) {
			// member.role="member": site leader (UserSite) or group leader (UserGroup)
			const userSiteIds = await getUserSiteIds(context.user.id);
			if (userSiteIds.length > 0) {
				if (!(await canAccessSite(context.user.id, group.siteId)))
					throw new ORPCError("FORBIDDEN");
			} else {
				if (!(await canManageGroup(context.user.id, input.id)))
					throw new ORPCError("FORBIDDEN");
			}
		}
		return group;
	});
