import { ORPCError } from "@orpc/client";
import { getEventById, updateEvent, getSiteById, getAreaById, getUserSiteIds } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite, canManageGroup } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";
import { updateEventSchema } from "../types";

export const updateEventProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/events/{id}", tags: ["Events"] })
  .input(updateEventSchema)
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
    const { id, startsAt, endsAt, ...rest } = input;
    return updateEvent(id, {
      ...rest,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
    });
  });
