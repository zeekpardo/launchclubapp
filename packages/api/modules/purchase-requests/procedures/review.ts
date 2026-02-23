import { ORPCError } from "@orpc/client";
import { reviewPurchaseRequest, getPurchaseRequestById, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { reviewPurchaseRequestSchema } from "../types";

export const reviewPurchaseRequestProcedure = protectedProcedure
  .route({ method: "POST", path: "/purchase-requests/{id}/review", tags: ["PurchaseRequests"] })
  .input(reviewPurchaseRequestSchema)
  .handler(async ({ input, context }) => {
    const existing = await getPurchaseRequestById(input.id);
    if (!existing) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(existing.group.site.id);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    if (membership.role !== "owner" && membership.role !== "admin" && context.user.role !== "admin") {
      throw new ORPCError("FORBIDDEN");
    }
    return reviewPurchaseRequest(input.id, input.status, context.user.id, input.reviewNote);
  });
