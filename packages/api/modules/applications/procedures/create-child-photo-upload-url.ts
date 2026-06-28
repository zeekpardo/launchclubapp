import { ORPCError } from "@orpc/client";
import { getSiteBySlug } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { enforceRateLimit, getClientIp } from "../../../orpc/rate-limit";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"] as const;
const EXT_MAP: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
};

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

export const createChildPhotoUploadUrl = publicProcedure
	.route({
		method: "POST",
		path: "/applications/child-photo-upload-url",
		tags: ["Applications"],
		summary: "Create child photo upload URL",
		description:
			"Create a signed upload URL for a child photo on the public application form",
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
		// Verify the site exists and is accepting applications before issuing a URL
		const site = await getSiteBySlug(input.siteSlug);
		if (!site || !site.acceptApplications) {
			throw new ORPCError("FORBIDDEN", {
				message:
					"Applications are not currently being accepted for this site.",
			});
		}

		const tempId = crypto.randomUUID();
		const ext = EXT_MAP[input.contentType];
		const path = `${tempId}.${ext}`;
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "avatars",
			contentType: input.contentType,
			maxBytes: MAX_PHOTO_BYTES,
		});
		return { signedUploadUrl, path };
	});
