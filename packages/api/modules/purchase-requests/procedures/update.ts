import { ORPCError } from "@orpc/client";
import {
	getAreaById,
	getPurchaseRequestById,
	getSiteById,
	updatePurchaseRequest,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canManageGroup } from "../../organizations/lib/site-access";
import { updatePurchaseRequestSchema } from "../types";

export const updatePurchaseRequestProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/purchase-requests/{id}",
		tags: ["PurchaseRequests"],
	})
	.input(updatePurchaseRequestSchema)
	.handler(async ({ input, context }) => {
		const { id, ...data } = input;
		const existing = await getPurchaseRequestById(id);
		if (!existing) throw new ORPCError("NOT_FOUND");
		const site = await getSiteById(existing.group.site.id);
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
			if (existing.requestedById !== context.user.id)
				throw new ORPCError("FORBIDDEN");
			if (!(await canManageGroup(context.user.id, existing.groupId)))
				throw new ORPCError("FORBIDDEN");
		}
		return updatePurchaseRequest(id, {
			name: data.name,
			description: data.description,
			dueDate:
				data.dueDate !== undefined
					? data.dueDate
						? new Date(data.dueDate)
						: null
					: undefined,
			items: data.items?.map((i) => ({ ...i, url: i.url || null })),
		});
	});
