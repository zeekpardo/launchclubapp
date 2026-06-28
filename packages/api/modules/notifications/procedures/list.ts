import { ORPCError } from "@orpc/client";
import { getNotificationsByUser } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { listNotificationsSchema } from "../types";

export const listNotificationsProcedure = protectedProcedure
	.route({ method: "GET", path: "/notifications", tags: ["Notifications"] })
	.input(listNotificationsSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getNotificationsByUser(context.user.id, input.organizationId);
	});
