import { ORPCError } from "@orpc/client";
import { getOrgApplicationSettings } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { getOrgApplicationSettingsSchema } from "../types";

export const getOrgApplicationSettingsProcedure = protectedProcedure
  .route({
    method: "GET",
    path: "/applications/org-settings",
    tags: ["Applications"],
    summary: "Get organization-level application settings",
  })
  .input(getOrgApplicationSettingsSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const settings = await getOrgApplicationSettings(input.organizationId);
    return settings ?? { autoMigrate: false, emailNotifications: false, studentIdMode: "auto", studentIdPrefix: "STU" };
  });
