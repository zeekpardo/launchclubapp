import { ORPCError } from "@orpc/client";
import { db } from "@repo/database/prisma/client";
import { deleteFormField } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { deleteFieldSchema } from "../types";

export const deleteField = protectedProcedure
  .route({ method: "DELETE", path: "/form-builder/fields/{id}", tags: ["FormBuilder"] })
  .input(deleteFieldSchema)
  .handler(async ({ input, context }) => {
    const field = await db.formField.findUnique({
      where: { id: input.id },
      include: { area: true, site: { include: { area: true } } },
    });
    if (!field) throw new ORPCError("NOT_FOUND");

    const organizationId = field.area?.organizationId ?? field.site?.area?.organizationId;
    if (!organizationId) throw new ORPCError("NOT_FOUND");

    const membership = await verifyOrganizationMembership(organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    return deleteFormField(input.id);
  });
