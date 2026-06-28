import { ORPCError } from "@orpc/client";
import {
	getAreaById,
	getAttendanceByEvent,
	getEventById,
	getSiteById,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const listAttendance = protectedProcedure
	.route({ method: "GET", path: "/attendance", tags: ["Attendance"] })
	.input(z.object({ eventId: z.string() }))
	.handler(async ({ input, context }) => {
		const event = await getEventById(input.eventId);
		if (!event) throw new ORPCError("NOT_FOUND");
		const firstGroup = event.eventGroups[0]?.group;
		if (!firstGroup) throw new ORPCError("NOT_FOUND");
		const site = await getSiteById(firstGroup.siteId);
		if (!site) throw new ORPCError("NOT_FOUND");
		const area = await getAreaById(site.areaId);
		if (!area) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			area.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getAttendanceByEvent(input.eventId);
	});
