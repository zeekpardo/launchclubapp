import { getSignedUploadUrl } from "@repo/storage";
import { nanoid } from "nanoid";
import { publicProcedure } from "../../../orpc/procedures";
import { enforceRateLimit, getClientIp } from "../../../orpc/rate-limit";
import { publicConsentUploadUrlSchema } from "../types";

export const publicConsentUploadUrl = publicProcedure
	.route({
		method: "POST",
		path: "/public/forms/consent-upload-url",
		tags: ["Forms"],
		summary:
			"Generate a presigned S3 upload URL for an applicant's signed consent document",
	})
	.input(publicConsentUploadUrlSchema)
	.handler(async ({ input, context }) => {
		enforceRateLimit(
			`upload-url:${getClientIp(context.headers)}`,
			30,
			10 * 60 * 1000,
		);
		const ext =
			input.contentType === "application/pdf"
				? "pdf"
				: input.contentType.split("/")[1];
		const fileKey = `consent-responses/${input.consentItemId}/${nanoid()}.${ext}`;
		const uploadUrl = await getSignedUploadUrl(fileKey, {
			bucket: "consentSignatures",
			contentType: input.contentType,
			maxBytes: 20 * 1024 * 1024,
		});
		return { uploadUrl, fileKey };
	});
