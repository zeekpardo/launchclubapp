import { ORPCError } from "@orpc/client";
import { createGroup, getSiteById, getAreaById, getUserSiteIds } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";
import { createGroupSchema } from "../types";

export const createGroupProcedure = protectedProcedure
  .route({ method: "POST", path: "/groups", tags: ["Groups"] })
  .input(createGroupSchema)
  .handler(async ({ input, context }) => {
    const site = await getSiteById(input.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    // owner, LC admin, or platform admin: full access
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwner) {
      // Only site leaders (not group leaders) can create groups
      const userSiteIds = await getUserSiteIds(context.user.id);
      if (userSiteIds.length === 0) throw new ORPCError("FORBIDDEN");
      if (!(await canAccessSite(context.user.id, input.siteId))) throw new ORPCError("FORBIDDEN");
    }
    return createGroup(input);
  });
