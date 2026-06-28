import { ORPCError } from "@orpc/client";
import { getApplicationById } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";
import { getApplicationFileDownloadUrlSchema } from "../types";

export const getApplicationFileDownloadUrlProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/applications/file-download-url",
		tags: ["Applications"],
		summary:
			"Get a presigned download URL for an uploaded application file field",
	})
	.input(getApplicationFileDownloadUrlSchema)
	.handler(async ({ input, context }) => {
		const application = await getApplicationById(input.applicationId);
		if (!application) throw new ORPCError("NOT_FOUND");
		const organizationId = application.site?.area?.organizationId;
		if (!organizationId) throw new ORPCError("NOT_FOUND");

		const membership = await verifyOrganizationMembership(
			organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) {
			const siteId = application.site?.id;
			if (!siteId || !(await canAccessSite(context.user.id, siteId)))
				throw new ORPCError("FORBIDDEN");
		}

		// Only allow downloading file paths that actually belong to this application's
		// FILE-type form field values — prevents fetching arbitrary storage keys.
		const fileValues = new Set<string>();
		for (const ffv of application.customFieldValues ?? []) {
			if (ffv.formField?.type === "FILE" && ffv.value)
				fileValues.add(ffv.value);
		}
		for (const child of application.children ?? []) {
			for (const ffv of child.formFieldValues ?? []) {
				if (ffv.formField?.type === "FILE" && ffv.value)
					fileValues.add(ffv.value);
			}
		}
		if (!fileValues.has(input.path)) throw new ORPCError("NOT_FOUND");

		const downloadUrl = await getSignedUrl(input.path, {
			bucket: "customFields",
			expiresIn: 3600,
		});
		return { downloadUrl };
	});
