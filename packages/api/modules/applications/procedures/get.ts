import { ORPCError } from "@orpc/client";
import { getApplicationById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";

export const getApplication = protectedProcedure
	.route({
		method: "GET",
		path: "/applications/{id}",
		tags: ["Applications"],
	})
	.input(z.object({ id: z.string() }))
	.handler(async ({ input, context }) => {
		const application = await getApplicationById(input.id);
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
			// Site leaders can view applications for their assigned sites
			const siteId = application.site?.id;
			if (!siteId || !(await canAccessSite(context.user.id, siteId)))
				throw new ORPCError("FORBIDDEN");
		}
		return application;
	});
