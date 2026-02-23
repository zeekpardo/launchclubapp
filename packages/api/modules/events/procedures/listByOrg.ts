import { ORPCError } from "@orpc/client";
import { getEventsByOrganization, getUserGroupIds, getUserSiteIds } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const listEventsByOrg = protectedProcedure
  .route({ method: "GET", path: "/events/org", tags: ["Events"] })
  .input(
    z.object({
      organizationId: z.string(),
      areaId: z.string().optional(),
      siteId: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(
      input.organizationId,
      context.user.id,
    );
    if (!membership) throw new ORPCError("FORBIDDEN");

    // owner, LC admin (member.role="admin"), or platform admin: see all events
    // site leader (member.role="member" + UserSite): see events in their assigned sites
    // group leader (member.role="member" + UserGroup): see events in their assigned groups
    const isOrgOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";

    let groupIds: string[] | undefined;
    let siteIds: string[] | undefined;

    if (!isOrgOwner) {
      const userSiteIds = await getUserSiteIds(context.user.id);
      if (userSiteIds.length > 0) {
        siteIds = userSiteIds;
      } else {
        groupIds = await getUserGroupIds(context.user.id);
      }
    }

    return getEventsByOrganization(input.organizationId, {
      areaId: input.areaId,
      siteId: input.siteId,
      groupIds,
      siteIds,
    });
  });
