import { ORPCError } from "@orpc/client";
import {
	getAreaById,
	getResourceById,
	getSiteById,
	getUserSiteIds,
	updateResource,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import {
	canAccessSite,
	canManageGroup,
} from "../../organizations/lib/site-access";
import { updateResourceSchema } from "../types";

export const updateResourceProcedure = protectedProcedure
	.route({ method: "PATCH", path: "/resources/{id}", tags: ["Resources"] })
	.input(updateResourceSchema)
	.handler(async ({ input, context }) => {
		const resource = await getResourceById(input.id);
		if (!resource) throw new ORPCError("NOT_FOUND");
		const site = await getSiteById(resource.group.site.id);
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
				if (
					!(await canAccessSite(
						context.user.id,
						resource.group.site.id,
					))
				)
					throw new ORPCError("FORBIDDEN");
			} else {
				if (!(await canManageGroup(context.user.id, resource.groupId)))
					throw new ORPCError("FORBIDDEN");
			}
		}
		const { id, ...data } = input;
		return updateResource(id, data);
	});
