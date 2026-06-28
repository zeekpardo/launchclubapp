import { ORPCError } from "@orpc/client";
import {
	getMentorApplicationsByOrganization,
	getMentorApplicationsByUserSites,
	getUserSiteIds,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { listMentorApplicationsSchema } from "../types";

export const listMentorApplications = protectedProcedure
	.route({
		method: "GET",
		path: "/mentor-applications",
		tags: ["MentorApplications"],
	})
	.input(listMentorApplicationsSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		const isOwnerOrAdmin =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (isOwnerOrAdmin) {
			return getMentorApplicationsByOrganization(
				input.organizationId,
				input.status,
			);
		}
		// Site leaders see only mentor applications for their assigned sites
		// (mirrors student application scoping); members with no sites see none.
		const siteIds = await getUserSiteIds(context.user.id);
		if (siteIds.length === 0) throw new ORPCError("FORBIDDEN");
		return getMentorApplicationsByUserSites(context.user.id, input.status);
	});
