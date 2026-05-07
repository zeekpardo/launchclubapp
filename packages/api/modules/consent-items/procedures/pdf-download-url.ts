import { z } from "zod";
import { ORPCError } from "@orpc/client";
import { getConsentItem } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

const pdfDownloadUrlSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
});

export const pdfDownloadUrlProcedure = protectedProcedure
  .route({
    method: "POST",
    path: "/consent-items/{id}/pdf-download-url",
    tags: ["Consent Items"],
    summary: "Generate a presigned S3 GET URL for viewing a consent item PDF",
  })
  .input(pdfDownloadUrlSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");

    const item = await getConsentItem(input.id);
    if (!item || item.organizationId !== input.organizationId) throw new ORPCError("NOT_FOUND");

    if (!item.pdfKey) throw new ORPCError("NOT_FOUND");

    const downloadUrl = await getSignedUrl(item.pdfKey, { bucket: "consentForms", expiresIn: 3600 });
    return { downloadUrl };
  });
