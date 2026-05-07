import { getPeopleByOrganization, getUserGroupIds, getUserSiteIds } from "@repo/database";
import { ORPCError } from "@orpc/client";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listPeopleSchema } from "../types";

export const listPeople = protectedProcedure
  .route({ method: "GET", path: "/people", tags: ["People"] })
  .input(listPeopleSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");

    // owner, LC admin (member.role="admin"), or platform admin: see everyone
    // site leader (member.role="member" + UserSite): see people in their assigned sites
    // group leader (member.role="member" + UserGroup): see people in their assigned groups
    const isOrgOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";

    let siteIds: string[] | undefined;
    let groupIds: string[] | undefined;

    if (!isOrgOwner) {
      const userSiteIds = await getUserSiteIds(context.user.id);
      if (userSiteIds.length > 0) {
        siteIds = userSiteIds;
      } else {
        groupIds = await getUserGroupIds(context.user.id);
      }
    }

    return getPeopleByOrganization(input.organizationId, {
      personType: input.personType,
      isActive: input.isActive,
      query: input.query,
      areaId: input.areaId,
      siteId: input.siteId,
      siteIds,
      groupIds,
    });
  });
