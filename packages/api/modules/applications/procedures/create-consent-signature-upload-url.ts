import { ORPCError } from "@orpc/client";
import { getSiteBySlug } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"] as const;

export const createConsentSignatureUploadUrlProcedure = publicProcedure
  .route({
    method: "POST",
    path: "/applications/consent-signature-upload-url",
    tags: ["Applications"],
    summary: "Create consent signature upload URL",
  })
  .input(z.object({
    contentType: z.enum(ALLOWED_MIME_TYPES),
    siteSlug: z.string().max(200),
  }))
  .handler(async ({ input }) => {
    const site = await getSiteBySlug(input.siteSlug);
    if (!site || !site.acceptApplications) {
      throw new ORPCError("FORBIDDEN", {
        message: "Applications are not currently being accepted for this site.",
      });
    }

    const ext = input.contentType === "application/pdf" ? "pdf" : input.contentType.split("/")[1];
    const path = `consent-signatures/${crypto.randomUUID()}.${ext}`;
    const signedUploadUrl = await getSignedUploadUrl(path, {
      bucket: "consentSignatures",
      contentType: input.contentType,
      maxBytes: 10 * 1024 * 1024,
    });
    return { signedUploadUrl, path };
  });
