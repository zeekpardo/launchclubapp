import { ORPCError } from "@orpc/client";
import {
	createNotification,
	getAreaById,
	getPurchaseRequestById,
	getSiteById,
	reviewPurchaseRequest,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { NOTIFICATION_TYPES } from "../../notifications/lib/notification-types";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { reviewPurchaseRequestSchema } from "../types";

export const reviewPurchaseRequestProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/purchase-requests/{id}/review",
		tags: ["PurchaseRequests"],
	})
	.input(reviewPurchaseRequestSchema)
	.handler(async ({ input, context }) => {
		const existing = await getPurchaseRequestById(input.id);
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
		if (
			membership.role !== "owner" &&
			membership.role !== "admin" &&
			context.user.role !== "admin"
		) {
			throw new ORPCError("FORBIDDEN");
		}
		const result = await reviewPurchaseRequest(
			input.id,
			input.status,
			context.user.id,
			input.reviewNote,
		);

		if (
			input.status !== "PENDING" &&
			existing.requestedById !== context.user.id
		) {
			const nt = NOTIFICATION_TYPES.PURCHASE_REQUEST_STATUS_CHANGED;
			createNotification({
				organizationId: area.organizationId,
				recipientId: existing.requestedById,
				type: "PURCHASE_REQUEST_STATUS_CHANGED",
				title: nt.title(input.status),
				message: nt.message(existing.name, input.status),
				link: "/purchase-requests",
				entityType: "purchase_request",
				entityId: input.id,
			}).catch(() => {});
		}

		return result;
	});
