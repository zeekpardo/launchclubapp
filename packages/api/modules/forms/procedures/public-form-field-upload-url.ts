import { getSignedUploadUrl } from "@repo/storage";
import { publicProcedure } from "../../../orpc/procedures";
import { publicFormFieldUploadUrlSchema } from "../types";

const EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"application/pdf": "pdf",
};

export const publicFormFieldUploadUrl = publicProcedure
	.route({
		method: "POST",
		path: "/public/forms/field-upload-url",
		tags: ["Forms"],
		summary:
			"Generate a presigned upload URL for a FILE form field on a public form",
	})
	.input(publicFormFieldUploadUrlSchema)
	.handler(async ({ input }) => {
		// Same bucket/key shape as applications.formFieldFileUploadUrl so the admin
		// file viewer (applications.fileFieldDownloadUrl) can resolve it.
		const ext = EXT[input.contentType];
		const path = `form-fields/${crypto.randomUUID()}.${ext}`;
		const uploadUrl = await getSignedUploadUrl(path, {
			bucket: "customFields",
			contentType: input.contentType,
			maxBytes: 10 * 1024 * 1024,
		});
		return { uploadUrl, path };
	});
