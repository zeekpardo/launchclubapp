import { z } from "zod";
import { ORPCError } from "@orpc/client";
import { getConsentItem, deleteConsentItem } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

const deleteConsentItemSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
});

export const deleteConsentItemProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/consent-items/{id}", tags: ["Consent Items"] })
  .input(deleteConsentItemSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    const item = await getConsentItem(input.id);
    if (!item || item.organizationId !== input.organizationId) throw new ORPCError("NOT_FOUND");
    return deleteConsentItem(input.id);
  });
