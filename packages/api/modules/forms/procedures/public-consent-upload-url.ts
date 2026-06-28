import { nanoid } from "nanoid";
import { getSignedUploadUrl } from "@repo/storage";
import { publicProcedure } from "../../../orpc/procedures";
import { enforceRateLimit, getClientIp } from "../../../orpc/rate-limit";
import { publicConsentUploadUrlSchema } from "../types";

export const publicConsentUploadUrl = publicProcedure
  .route({
    method: "POST",
    path: "/public/forms/consent-upload-url",
    tags: ["Forms"],
    summary: "Generate a presigned S3 upload URL for an applicant's signed consent document",
  })
  .input(publicConsentUploadUrlSchema)
  .handler(async ({ input, context }) => {
    enforceRateLimit(`upload-url:${getClientIp(context.headers)}`, 30, 10 * 60 * 1000);
    const fileKey = `consent-responses/${input.consentItemId}/${nanoid()}.pdf`;
    const uploadUrl = await getSignedUploadUrl(fileKey, {
      bucket: "consentSignatures",
      contentType: "application/pdf",
      maxBytes: 20 * 1024 * 1024,
    });
    return { uploadUrl, fileKey };
  });
