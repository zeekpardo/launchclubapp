import { ORPCError } from "@orpc/client";
import { getSiteById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listSiteFieldsSchema } from "../types";

/**
 * @deprecated Form fields are now scoped to Form objects (formId), not sites.
 * This endpoint is kept for backward compatibility during UI migration.
 * Use listFormFields instead.
 */
export const listSiteFields = protectedProcedure
  .route({ method: "GET", path: "/form-builder/site-fields", tags: ["FormBuilder"] })
  .input(listSiteFieldsSchema)
  .handler(async ({ input, context }) => {
    const site = await getSiteById(input.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(site.area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    return [];
  });
