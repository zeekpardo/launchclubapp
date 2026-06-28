import { ORPCError } from "@orpc/client";
import { getPurchaseRequestsByOrganization } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const listAllPurchaseRequests = protectedProcedure
	.route({
		method: "GET",
		path: "/purchase-requests/all",
		tags: ["PurchaseRequests"],
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		// Site/group leaders ("member" role) have no org-wide purchase request visibility
		if (!isOwner) return [];
		return getPurchaseRequestsByOrganization(input.organizationId);
	});
