import { ORPCError } from "@orpc/client";
import { getSignedUploadUrl } from "@repo/storage";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createConsentFormUploadUrlSchema } from "../types";

export const createConsentFormUploadUrlProcedure = protectedProcedure
  .route({
    method: "POST",
    path: "/applications/consent-form-upload-url",
    tags: ["Applications"],
    summary: "Create a presigned upload URL for a consent form PDF (admin only)",
  })
  .input(createConsentFormUploadUrlSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    const path = `${input.organizationId}/${input.consentType}.pdf`;
    const uploadUrl = await getSignedUploadUrl(path, {
      bucket: "consentForms",
      contentType: "application/pdf",
      maxBytes: 20 * 1024 * 1024,
    });
    return { uploadUrl, fileUrl: path };
  });
