import { ORPCError } from "@orpc/client";
import {
	getAreaById,
	getGroupById,
	getSiteById,
	getUserSiteIds,
	updateGroup,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import {
	canAccessSite,
	canManageGroup,
} from "../../organizations/lib/site-access";
import { updateGroupSchema } from "../types";

export const updateGroupProcedure = protectedProcedure
	.route({ method: "PATCH", path: "/groups/{id}", tags: ["Groups"] })
	.input(updateGroupSchema)
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
			const userSiteIds = await getUserSiteIds(context.user.id);
			if (userSiteIds.length > 0) {
				if (!(await canAccessSite(context.user.id, group.siteId)))
					throw new ORPCError("FORBIDDEN");
			} else {
				if (!(await canManageGroup(context.user.id, input.id)))
					throw new ORPCError("FORBIDDEN");
			}
		}
		const { id, ...data } = input;
		return updateGroup(id, data);
	});
