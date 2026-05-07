import { ORPCError } from "@orpc/client";
import { getFormById, softDeleteForm } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { softDeleteFormSchema } from "../types";

export const softDeleteFormProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/forms/{formId}", tags: ["Forms"], summary: "Soft-delete a form" })
  .input(softDeleteFormSchema)
  .handler(async ({ input, context }) => {
    const form = await getFormById(input.formId);
    if (!form) throw new ORPCError("NOT_FOUND");

    const membership = await verifyOrganizationMembership(form.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    return softDeleteForm(input.formId);
  });
