import { ORPCError } from "@orpc/client";
import { markAllNotificationsAsRead } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { markAllAsReadSchema } from "../types";

export const markAllAsReadProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/mark-all-read",
		tags: ["Notifications"],
	})
	.input(markAllAsReadSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		await markAllNotificationsAsRead(context.user.id, input.organizationId);
		return { success: true };
	});
