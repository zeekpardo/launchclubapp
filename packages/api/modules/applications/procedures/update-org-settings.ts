import { ORPCError } from "@orpc/client";
import { upsertOrgApplicationSettings } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { updateOrgApplicationSettingsSchema } from "../types";

export const updateOrgApplicationSettingsProcedure = protectedProcedure
  .route({
    method: "PATCH",
    path: "/applications/org-settings",
    tags: ["Applications"],
    summary: "Update organization-level application settings",
  })
  .input(updateOrgApplicationSettingsSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwner) throw new ORPCError("FORBIDDEN");

    const { organizationId, ...data } = input;
    return upsertOrgApplicationSettings(organizationId, data);
  });
