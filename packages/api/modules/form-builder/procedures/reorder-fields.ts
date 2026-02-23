import { ORPCError } from "@orpc/client";
import { db } from "@repo/database/prisma/client";
import { reorderFormFields } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { reorderFieldsSchema } from "../types";

export const reorderFields = protectedProcedure
  .route({ method: "POST", path: "/form-builder/fields/reorder", tags: ["FormBuilder"] })
  .input(reorderFieldsSchema)
  .handler(async ({ input, context }) => {
    if (input.ids.length === 0) return [];

    const field = await db.formField.findUnique({
      where: { id: input.ids[0] },
      include: { area: true, site: { include: { area: true } } },
    });
    if (!field) throw new ORPCError("NOT_FOUND");

    const organizationId = field.area?.organizationId ?? field.site?.area?.organizationId;
    if (!organizationId) throw new ORPCError("NOT_FOUND");

    const membership = await verifyOrganizationMembership(organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    return reorderFormFields(input.ids);
  });
