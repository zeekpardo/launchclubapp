import { ORPCError } from "@orpc/client";
import { getSignedUrl } from "@repo/storage";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { getConsentFormDownloadUrlSchema } from "../types";

export const getConsentFormDownloadUrlProcedure = protectedProcedure
  .route({
    method: "POST",
    path: "/applications/consent-form-download-url",
    tags: ["Applications"],
    summary: "Get a presigned download URL for a consent form PDF (admin only)",
  })
  .input(getConsentFormDownloadUrlSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    const key = `${input.organizationId}/${input.consentType}.pdf`;
    const downloadUrl = await getSignedUrl(key, { bucket: "consentForms", expiresIn: 3600 });
    return { downloadUrl };
  });
