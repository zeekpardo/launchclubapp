import { ORPCError } from "@orpc/client";
import {
	createPurchaseRequest,
	getAreaById,
	getGroupById,
	getSiteById,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canManageGroup } from "../../organizations/lib/site-access";
import { createPurchaseRequestSchema } from "../types";

export const createPurchaseRequestProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/purchase-requests",
		tags: ["PurchaseRequests"],
	})
	.input(createPurchaseRequestSchema)
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
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) {
			if (!(await canManageGroup(context.user.id, input.groupId)))
				throw new ORPCError("FORBIDDEN");
		}
		return createPurchaseRequest({
			groupId: input.groupId,
			name: input.name,
			description: input.description,
			dueDate: input.dueDate ? new Date(input.dueDate) : null,
			requestedById: context.user.id,
			items: input.items.map((i) => ({ ...i, url: i.url || undefined })),
		});
	});
