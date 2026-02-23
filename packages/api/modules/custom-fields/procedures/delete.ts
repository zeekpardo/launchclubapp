import { ORPCError } from "@orpc/client";
import { getCustomFieldById, deleteCustomField } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteCustomFieldProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/custom-fields/:id", tags: ["CustomFields"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const field = await getCustomFieldById(input.id);
    if (!field) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(field.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwnerOrAdmin = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwnerOrAdmin) throw new ORPCError("FORBIDDEN");
    await deleteCustomField(input.id);
    return { success: true };
  });
