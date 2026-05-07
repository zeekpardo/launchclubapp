import { ORPCError } from "@orpc/client";
import { getSignedUploadUrl } from "@repo/storage";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createMentorDocUploadUrlSchema } from "../types";

export const createMentorDocUploadUrlProcedure = protectedProcedure
  .route({
    method: "POST",
    path: "/applications/mentor-doc-upload-url",
    tags: ["Applications"],
    summary: "Create a presigned upload URL for a mentor document PDF (admin only)",
  })
  .input(createMentorDocUploadUrlSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    const path = `${input.organizationId}/mentor-${input.docType}.pdf`;
    const uploadUrl = await getSignedUploadUrl(path, {
      bucket: "consentForms",
      contentType: "application/pdf",
      maxBytes: 20 * 1024 * 1024,
    });
    return { uploadUrl, fileUrl: path };
  });
