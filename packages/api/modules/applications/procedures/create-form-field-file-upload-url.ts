import { ORPCError } from "@orpc/client";
import { getSiteBySlug } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { enforceRateLimit, getClientIp } from "../../../orpc/rate-limit";

const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"application/pdf",
] as const;

const EXT_MAP: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"application/pdf": "pdf",
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export const createFormFieldFileUploadUrl = publicProcedure
	.route({
		method: "POST",
		path: "/applications/form-field-file-upload-url",
		tags: ["Applications"],
		summary: "Create form field file upload URL",
		description:
			"Create a signed upload URL for a file form field on the public application form",
	})
	.input(
		z.object({
			contentType: z.enum(ALLOWED_MIME_TYPES),
			siteSlug: z.string().max(200),
		}),
	)
	.handler(async ({ input, context }) => {
		enforceRateLimit(
			`upload-url:${getClientIp(context.headers)}`,
			30,
			10 * 60 * 1000,
		);
		const site = await getSiteBySlug(input.siteSlug);
		if (!site || !site.acceptApplications) {
			throw new ORPCError("FORBIDDEN", {
				message:
					"Applications are not currently being accepted for this site.",
			});
		}

		const tempId = crypto.randomUUID();
		const ext = EXT_MAP[input.contentType];
		const path = `form-fields/${tempId}.${ext}`;
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "customFields",
			contentType: input.contentType,
			maxBytes: MAX_FILE_BYTES,
		});
		return { signedUploadUrl, path };
	});
