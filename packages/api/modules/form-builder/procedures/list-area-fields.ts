import { ORPCError } from "@orpc/client";
import { getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listAreaFieldsSchema } from "../types";

/**
 * @deprecated Form fields are now scoped to Form objects (formId), not areas.
 * This endpoint is kept for backward compatibility during UI migration.
 * Use listFormFields instead.
 */
export const listAreaFields = protectedProcedure
  .route({ method: "GET", path: "/form-builder/area-fields", tags: ["FormBuilder"] })
  .input(listAreaFieldsSchema)
  .handler(async ({ input, context }) => {
    const area = await getAreaById(input.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    return [];
  });
