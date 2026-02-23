import { ORPCError } from "@orpc/client";
import { deleteEvent, getEventById, getSiteById, getAreaById, getUserSiteIds } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite, canManageGroup } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteEventProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/events/{id}", tags: ["Events"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const event = await getEventById(input.id);
    if (!event) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(event.group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwner) {
      const userSiteIds = await getUserSiteIds(context.user.id);
      if (userSiteIds.length > 0) {
        if (!(await canAccessSite(context.user.id, event.group.siteId))) throw new ORPCError("FORBIDDEN");
      } else {
        if (!(await canManageGroup(context.user.id, event.groupId))) throw new ORPCError("FORBIDDEN");
      }
    }
    await deleteEvent(input.id);
    return { success: true };
  });
