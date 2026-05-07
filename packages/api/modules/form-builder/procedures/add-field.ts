import { ORPCError } from "@orpc/client";
import { getFormById, createFormField } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { addFieldSchema } from "../types";

export const addField = protectedProcedure
  .route({ method: "POST", path: "/form-builder/fields", tags: ["FormBuilder"] })
  .input(addFieldSchema)
  .handler(async ({ input, context }) => {
    const form = await getFormById(input.formId);
    if (!form) throw new ORPCError("NOT_FOUND");

    const membership = await verifyOrganizationMembership(form.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    return createFormField(input);
  });
