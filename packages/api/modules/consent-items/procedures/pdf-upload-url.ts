import { z } from "zod";
import { ORPCError } from "@orpc/client";
import { getConsentItem } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

const pdfUploadUrlSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
});

export const pdfUploadUrlProcedure = protectedProcedure
  .route({
    method: "POST",
    path: "/consent-items/{id}/pdf-upload-url",
    tags: ["Consent Items"],
    summary: "Generate a presigned S3 PUT URL for uploading a consent item PDF (admin only)",
  })
  .input(pdfUploadUrlSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    const item = await getConsentItem(input.id);
    if (!item || item.organizationId !== input.organizationId) throw new ORPCError("NOT_FOUND");

    const path = `consent-items/${input.organizationId}/${input.id}.pdf`;
    const uploadUrl = await getSignedUploadUrl(path, {
      bucket: "consentForms",
      contentType: "application/pdf",
      maxBytes: 20 * 1024 * 1024,
    });
    return { uploadUrl, fileKey: path };
  });
