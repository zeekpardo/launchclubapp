import { ORPCError } from "@orpc/client";
import { getPersonById } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { nanoid } from "nanoid";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { academicPhotoUploadUrlSchema } from "../types";

export const createAcademicPhotoUploadUrlProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/academic-records/photo-upload-url",
		tags: ["Academic Records"],
		summary: "Create a signed upload URL for an academic record photo",
	})
	.input(academicPhotoUploadUrlSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			person.organizationId,
			context.user.id,
		);
		if (
			!membership ||
			(membership.role !== "owner" &&
				membership.role !== "admin" &&
				context.user.role !== "admin")
		) {
			throw new ORPCError("FORBIDDEN");
		}

		const ext = input.contentType === "image/png" ? "png" : "jpg";
		// Key under custom-fields/{orgId}/… so the image-proxy enforces org scope.
		const path = `custom-fields/${person.organizationId}/academic/${nanoid()}.${ext}`;
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "customFields",
			contentType: input.contentType,
			maxBytes: 10 * 1024 * 1024,
		});

		return { signedUploadUrl, path };
	});
