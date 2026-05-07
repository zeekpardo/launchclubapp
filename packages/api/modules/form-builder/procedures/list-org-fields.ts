import { ORPCError } from "@orpc/client";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listOrgFieldsSchema } from "../types";

/**
 * @deprecated Form fields are now scoped to Form objects (formId), not organizations.
 * This endpoint is kept for backward compatibility during UI migration.
 * Use listFormFields instead.
 */
export const listOrgFields = protectedProcedure
  .route({ method: "GET", path: "/form-builder/org-fields", tags: ["FormBuilder"] })
  .input(listOrgFieldsSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    return [];
  });
