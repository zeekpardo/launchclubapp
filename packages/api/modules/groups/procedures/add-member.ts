import { ORPCError } from "@orpc/client";
import { addPersonToGroup, getGroupById, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";
import { addMemberSchema } from "../types";

export const addMember = protectedProcedure
  .route({ method: "POST", path: "/groups/{groupId}/members", tags: ["Groups"] })
  .input(addMemberSchema)
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
    return addPersonToGroup(input.personId, input.groupId, input.role);
  });
