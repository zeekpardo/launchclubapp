import { ORPCError } from "@orpc/client";
import { getFormsByOrganization, getUserSiteIds } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listFormsSchema } from "../types";

export const listForms = protectedProcedure
  .route({ method: "GET", path: "/forms", tags: ["Forms"], summary: "List forms for an organization" })
  .input(listFormsSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwnerOrAdmin = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwnerOrAdmin) {
      const siteIds = await getUserSiteIds(context.user.id);
      if (siteIds.length === 0) throw new ORPCError("FORBIDDEN");
    }
    return getFormsByOrganization(input.organizationId);
  });
