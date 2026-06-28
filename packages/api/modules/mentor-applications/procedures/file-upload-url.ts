import { ORPCError } from "@orpc/client";
import { getOrganizationBySlug } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { publicProcedure } from "../../../orpc/procedures";
import { enforceRateLimit, getClientIp } from "../../../orpc/rate-limit";
import { mentorApplicationFileUploadUrlSchema } from "../types";

const ALLOWED_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/jpg",
	"image/png",
] as const;
const MAX_BYTES = 10 * 1024 * 1024;

export const mentorApplicationFileUploadUrl = publicProcedure
	.route({
		method: "POST",
		path: "/mentor-applications/file-upload-url",
		tags: ["MentorApplications"],
	})
	.input(mentorApplicationFileUploadUrlSchema)
	.handler(async ({ input, context }) => {
		enforceRateLimit(
			`upload-url:${getClientIp(context.headers)}`,
			30,
			10 * 60 * 1000,
		);
		const org = await getOrganizationBySlug(input.orgSlug);
		if (!org) throw new ORPCError("NOT_FOUND");

		if (!(ALLOWED_TYPES as readonly string[]).includes(input.contentType)) {
			throw new ORPCError("BAD_REQUEST");
		}

		const ext =
			input.contentType === "application/pdf"
				? "pdf"
				: input.contentType.split("/")[1];
		const path = `mentor-applications/${org.id}/${crypto.randomUUID()}.${ext}`;
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "consentSignatures",
			contentType: input.contentType,
			maxBytes: MAX_BYTES,
		});
		return { signedUploadUrl, path };
	});
