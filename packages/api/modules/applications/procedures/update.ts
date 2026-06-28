import { ORPCError } from "@orpc/client";
import { getApplicationById, updateApplication } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";
import { updateApplicationSchema } from "../types";

export const updateApplicationProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/applications/{id}",
		tags: ["Applications"],
	})
	.input(updateApplicationSchema)
	.handler(async ({ input, context }) => {
		const application = await getApplicationById(input.id);
		if (!application) {
			throw new ORPCError("NOT_FOUND");
		}
		const organizationId = application.site?.area?.organizationId;
		if (!organizationId) {
			throw new ORPCError("NOT_FOUND");
		}

		const membership = await verifyOrganizationMembership(
			organizationId,
			context.user.id,
		);
		if (!membership) {
			throw new ORPCError("FORBIDDEN");
		}
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) {
			const siteId = application.site?.id;
			if (!siteId || !(await canAccessSite(context.user.id, siteId))) {
				throw new ORPCError("FORBIDDEN");
			}
		}

		const { id, ...data } = input;
		return updateApplication(id, data);
	});
