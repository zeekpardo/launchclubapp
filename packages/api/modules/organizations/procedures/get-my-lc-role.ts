import {
  getGroupsByOrganization,
  getSitesByOrganization,
  getUserGroupIds,
  getUserSiteIds,
} from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const getMyLcRole = protectedProcedure
  .route({
    method: "GET",
    path: "/organizations/{organizationId}/my-role",
    tags: ["Organizations"],
  })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(
      input.organizationId,
      context.user.id,
    );

    if (membership.role === "owner") return { lcRole: "owner" as const };
    if (membership.role === "admin") return { lcRole: "admin" as const };

    // Scope the site/group lookups to THIS org — getUserSiteIds/getUserGroupIds
    // are global, so without this a site leader in org A would be reported as a
    // site leader in org B where they're only a plain member.
    const [userSiteIds, userGroupIds, orgSites, orgGroups] = await Promise.all([
      getUserSiteIds(context.user.id),
      getUserGroupIds(context.user.id),
      getSitesByOrganization(input.organizationId),
      getGroupsByOrganization(input.organizationId),
    ]);

    const orgSiteIds = new Set(orgSites.map((s) => s.id));
    if (userSiteIds.some((id) => orgSiteIds.has(id))) {
      return { lcRole: "site-leader" as const };
    }

    const orgGroupIds = new Set(orgGroups.map((g) => g.id));
    if (userGroupIds.some((id) => orgGroupIds.has(id))) {
      return { lcRole: "group-leader" as const };
    }

    return { lcRole: "member" as const };
  });
