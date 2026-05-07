import { z } from "zod";
import { ORPCError } from "@orpc/client";
import { getConsentItem, updateConsentItem } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

const updateConsentItemSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1).max(200).optional(),
  nameES: z.string().max(200).nullable().optional(),
  pdfKey: z.string().max(500).nullable().optional(),
  applicantType: z.enum(["STUDENT", "PARENT", "MENTOR"]).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateConsentItemProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/consent-items/{id}", tags: ["Consent Items"] })
  .input(updateConsentItemSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    const item = await getConsentItem(input.id);
    if (!item || item.organizationId !== input.organizationId) throw new ORPCError("NOT_FOUND");
    const { id, organizationId: _, ...data } = input;
    return updateConsentItem(id, data);
  });
