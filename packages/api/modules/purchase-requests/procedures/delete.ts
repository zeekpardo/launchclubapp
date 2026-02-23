import { ORPCError } from "@orpc/client";
import { deletePurchaseRequest, getPurchaseRequestById, getSiteById, getAreaById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canManageGroup } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";

export const deletePurchaseRequestProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/purchase-requests/{id}", tags: ["PurchaseRequests"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const existing = await getPurchaseRequestById(input.id);
    if (!existing) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(existing.group.site.id);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwner) {
      if (existing.requestedById !== context.user.id) throw new ORPCError("FORBIDDEN");
      if (!(await canManageGroup(context.user.id, existing.groupId))) throw new ORPCError("FORBIDDEN");
    }
    await deletePurchaseRequest(input.id);
    return { success: true };
  });
