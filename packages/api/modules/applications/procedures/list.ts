import { ORPCError } from "@orpc/client";
import {
	getApplicationsByOrganization,
	getApplicationsByUserSites,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { listApplicationsSchema } from "../types";

export const listApplications = protectedProcedure
	.route({ method: "GET", path: "/applications", tags: ["Applications"] })
	.input(listApplicationsSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		// owner, LC admin (member.role="admin"), or platform admin: see all applications
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (isOwner)
			return getApplicationsByOrganization(
				input.organizationId,
				input.status,
			);
		// site leaders (member.role="member" + UserSite) and group leaders see their scoped applications
		return getApplicationsByUserSites(context.user.id, input.status);
	});
