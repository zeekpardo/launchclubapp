import { ORPCError } from "@orpc/server";
import { getAreaById, getGroupById, getSiteById } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const createGroupImageUploadUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/groups/image-upload-url",
		tags: ["Groups"],
		summary: "Create group image upload URL",
		description:
			"Create a signed upload URL to upload a group image to the storage bucket",
	})
	.input(z.object({ groupId: z.string() }))
	.handler(async ({ context: { user }, input: { groupId } }) => {
		const group = await getGroupById(groupId);
		if (!group) throw new ORPCError("NOT_FOUND");
		const site = await getSiteById(group.siteId);
		if (!site) throw new ORPCError("NOT_FOUND");
		const area = await getAreaById(site.areaId);
		if (!area) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			area.organizationId,
			user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");

		const path = `${groupId}.png`;
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "avatars",
		});

		return { signedUploadUrl, path };
	});
