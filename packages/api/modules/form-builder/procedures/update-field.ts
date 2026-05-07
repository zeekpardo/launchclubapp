import { ORPCError } from "@orpc/client";
import { db } from "@repo/database/prisma/client";
import { updateFormField } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { updateFieldSchema } from "../types";

export const updateField = protectedProcedure
  .route({ method: "PATCH", path: "/form-builder/fields/{id}", tags: ["FormBuilder"] })
  .input(updateFieldSchema)
  .handler(async ({ input, context }) => {
    const { id, ...data } = input;

    const field = await db.formField.findUnique({
      where: { id },
      include: { form: true },
    });
    if (!field) throw new ORPCError("NOT_FOUND");

    const organizationId = field.form?.organizationId;
    if (!organizationId) throw new ORPCError("NOT_FOUND");

    const membership = await verifyOrganizationMembership(organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    return updateFormField(id, data);
  });
