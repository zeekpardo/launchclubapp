import { ORPCError } from "@orpc/client";
import { getGroupById, getSiteById, getAreaById, getResourcesByGroup } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const listResources = protectedProcedure
  .route({ method: "GET", path: "/resources", tags: ["Resources"] })
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
    return getResourcesByGroup(input.groupId);
  });
