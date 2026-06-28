import { ORPCError } from "@orpc/client";
import { getAreaById, getEventById, getSiteById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const getEvent = protectedProcedure
  .route({ method: "GET", path: "/events/{id}", tags: ["Events"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const event = await getEventById(input.id);
    if (!event) throw new ORPCError("NOT_FOUND");
    // Events link to groups via the EventGroup join table; derive the org from
    // the first group's site → area and verify the caller belongs to it.
    const group = event.eventGroups[0]?.group;
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    await verifyOrganizationMembership(area.organizationId, context.user.id);
    return event;
  });
