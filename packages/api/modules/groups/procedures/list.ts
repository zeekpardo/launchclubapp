import { ORPCError } from "@orpc/client";
import { getGroupsByOrganization, getGroupsByUserSites, getGroupsByUserGroups, getUserSiteIds } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const listGroups = protectedProcedure
  .route({ method: "GET", path: "/groups", tags: ["Groups"] })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    // owner, LC admin (member.role="admin"), or platform admin: full access
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (isOwner) return getGroupsByOrganization(input.organizationId);
    // member.role="member": site leader (has UserSite) or group leader (has UserGroup)
    const siteIds = await getUserSiteIds(context.user.id);
    if (siteIds.length > 0) return getGroupsByUserSites(context.user.id);
    return getGroupsByUserGroups(context.user.id);
  });
