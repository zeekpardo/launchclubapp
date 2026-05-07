import { ORPCError } from "@orpc/client";
import { getMentorApplicationsByOrganization, getUserSiteIds } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listMentorApplicationsSchema } from "../types";

export const listMentorApplications = protectedProcedure
  .route({ method: "GET", path: "/mentor-applications", tags: ["MentorApplications"] })
  .input(listMentorApplicationsSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwnerOrAdmin = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwnerOrAdmin) {
      const siteIds = await getUserSiteIds(context.user.id);
      if (siteIds.length === 0) throw new ORPCError("FORBIDDEN");
    }
    return getMentorApplicationsByOrganization(input.organizationId, input.status);
  });
