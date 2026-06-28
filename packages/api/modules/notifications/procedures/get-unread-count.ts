import { ORPCError } from "@orpc/client";
import { getUnreadNotificationCount } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { getUnreadCountSchema } from "../types";

export const getUnreadCountProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications/unread-count",
		tags: ["Notifications"],
	})
	.input(getUnreadCountSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const count = await getUnreadNotificationCount(
			context.user.id,
			input.organizationId,
		);
		return { count };
	});
