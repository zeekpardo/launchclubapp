import { nanoid } from "nanoid";
import { getSignedUploadUrl } from "@repo/storage";
import { publicProcedure } from "../../../orpc/procedures";
import { publicConsentUploadUrlSchema } from "../types";

export const publicConsentUploadUrl = publicProcedure
  .route({
    method: "POST",
    path: "/public/forms/consent-upload-url",
    tags: ["Forms"],
    summary: "Generate a presigned S3 upload URL for an applicant's signed consent document",
  })
  .input(publicConsentUploadUrlSchema)
  .handler(async ({ input }) => {
    const fileKey = `consent-responses/${input.consentItemId}/${nanoid()}.pdf`;
    const uploadUrl = await getSignedUploadUrl(fileKey, {
      bucket: "consentSignatures",
      contentType: "application/pdf",
      maxBytes: 20 * 1024 * 1024,
    });
    return { uploadUrl, fileKey };
  });
