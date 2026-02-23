import { ORPCError } from "@orpc/client";
import { getPurchaseRequestsByGroup, getGroupById, getSiteById, getAreaById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canManageGroup } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";

export const listPurchaseRequests = protectedProcedure
  .route({ method: "GET", path: "/purchase-requests", tags: ["PurchaseRequests"] })
  .input(z.object({ groupId: z.string() }))
  .handler(async ({ input, context }) => {
    const group = await getGroupById(input.groupId);
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwner) {
      if (!(await canManageGroup(context.user.id, input.groupId))) throw new ORPCError("FORBIDDEN");
    }
    return getPurchaseRequestsByGroup(input.groupId);
  });
