import { ORPCError } from "@orpc/client";
import { getPersonById } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { nanoid } from "nanoid";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { notePhotoUploadUrlSchema } from "../types";

export const createNotePhotoUploadUrlProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/person-notes/photo-upload-url",
		tags: ["Person Notes"],
		summary: "Create a signed upload URL for a note photo",
	})
	.input(notePhotoUploadUrlSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			person.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");

		const ext = input.contentType === "image/png" ? "png" : "jpg";
		// Key under custom-fields/{orgId}/… so the image-proxy enforces org scope.
		const path = `custom-fields/${person.organizationId}/notes/${nanoid()}.${ext}`;
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "customFields",
			contentType: input.contentType,
			maxBytes: 10 * 1024 * 1024,
		});

		return { signedUploadUrl, path };
	});
