import { ORPCError } from "@orpc/client";
import {
  getApplicationById,
  getOrgApplicationSettings,
  migrateApplicationToPeople,
  reviewApplication,
} from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";
import { reviewApplicationSchema } from "../types";

export const reviewApplicationProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/applications/{id}/review", tags: ["Applications"] })
  .input(reviewApplicationSchema)
  .handler(async ({ input, context }) => {
    const application = await getApplicationById(input.id);
    if (!application) throw new ORPCError("NOT_FOUND");
    const organizationId = application.site.area.organizationId;
    const membership = await verifyOrganizationMembership(organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwner) {
      // Site leaders can review applications for their assigned sites
      if (!(await canAccessSite(context.user.id, application.siteId))) throw new ORPCError("FORBIDDEN");
    }

    const reviewed = await reviewApplication(input.id, input.status, context.user.id);

    // Auto-migrate to household + people on first approval if org setting is enabled
    if (input.status === "APPROVED" && application.status !== "APPROVED") {
      const settings = await getOrgApplicationSettings(organizationId);
      if (settings?.autoMigrate) {
        await migrateApplicationToPeople(input.id, organizationId, input.groupAssignments);
      }
    }

    // TODO: send email notification to application.parentEmail when status changes
    // Use @repo/mail and the OrganizationApplicationSettings.emailNotifications flag

    return reviewed;
  });
