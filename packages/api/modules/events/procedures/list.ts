import { ORPCError } from "@orpc/client";
import {
	getAreaById,
	getEventsByGroup,
	getGroupById,
	getSiteById,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const listEvents = protectedProcedure
	.route({ method: "GET", path: "/events", tags: ["Events"] })
	.input(z.object({ groupId: z.string() }))
	.handler(async ({ input, context }) => {
		const group = await getGroupById(input.groupId);
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
		return getEventsByGroup(input.groupId);
	});
