import { ORPCError } from "@orpc/server";
import { getPersonById } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createConsentSignatureUploadUrlSchema } from "../types";

const ALLOWED_ROLES = ["owner", "admin", "siteLeader", "mentor"] as const;

export const createConsentSignatureUploadUrlProcedure = protectedProcedure
  .route({
    method: "POST",
    path: "/person-consents/signature-upload-url",
    tags: ["Person Consents"],
    summary: "Create consent signature upload URL",
    description: "Create a signed upload URL to upload a consent signature file to the storage bucket",
  })
  .input(createConsentSignatureUploadUrlSchema)
  .handler(async ({ input, context }) => {
    const person = await getPersonById(input.personId);
    if (!person) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(person.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    if (!ALLOWED_ROLES.includes(membership.role as (typeof ALLOWED_ROLES)[number])) {
      throw new ORPCError("FORBIDDEN");
    }

    const path = `consent-signatures/${input.personId}/${input.fileName}`;
    const uploadUrl = await getSignedUploadUrl(path, {
      bucket: "consentSignatures",
      contentType: input.contentType,
    });

    return { uploadUrl, fileUrl: path };
  });
