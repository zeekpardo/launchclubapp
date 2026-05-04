import { createEvent, getGroupById, getSiteById, getAreaById, getUserSiteIds } from "@repo/database";
import { ORPCError } from "@orpc/client";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite, canManageGroup } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";
import { createEventSchema } from "../types";

export const createEventProcedure = protectedProcedure
  .route({ method: "POST", path: "/events", tags: ["Events"] })
  .input(createEventSchema)
  .handler(async ({ input, context }) => {
    // Verify access using the first group (all groups must be in the same org)
    const group = await getGroupById(input.groupIds[0]);
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwner) {
      const userSiteIds = await getUserSiteIds(context.user.id);
      if (userSiteIds.length > 0) {
        if (!(await canAccessSite(context.user.id, group.siteId))) throw new ORPCError("FORBIDDEN");
      } else {
        if (!(await canManageGroup(context.user.id, input.groupIds[0]))) throw new ORPCError("FORBIDDEN");
      }
    }
    const { groupIds, startsAt, endsAt, ...rest } = input;
    return createEvent({
      groupIds,
      ...rest,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : undefined,
    });
  });
