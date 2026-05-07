import { ORPCError } from "@orpc/client";
import { removePersonFromGroup, getGroupById, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const removeMember = protectedProcedure
  .route({ method: "DELETE", path: "/groups/{groupId}/members/{personId}", tags: ["Groups"] })
  .input(z.object({ groupId: z.string(), personId: z.string() }))
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
      if (!(await canAccessSite(context.user.id, group.siteId))) throw new ORPCError("FORBIDDEN");
    }
    await removePersonFromGroup(input.personId, input.groupId);
    return { success: true };
  });
