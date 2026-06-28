import { ORPCError } from "@orpc/client";
import { getAreaById, getSiteById, updateSite } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";
import { updateSiteSchema } from "../types";

export const updateSiteProcedure = protectedProcedure
	.route({ method: "PATCH", path: "/sites/{id}", tags: ["Sites"] })
	.input(updateSiteSchema)
	.handler(async ({ input, context }) => {
		const site = await getSiteById(input.id);
		if (!site) throw new ORPCError("NOT_FOUND");
		const area = await getAreaById(site.areaId);
		if (!area) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			area.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) {
			// Site leaders can update their assigned sites
			if (!(await canAccessSite(context.user.id, input.id)))
				throw new ORPCError("FORBIDDEN");
		}
		const { id, applicationDeadline, ...rest } = input;
		return updateSite(id, {
			...rest,
			applicationDeadline:
				applicationDeadline === null
					? null
					: applicationDeadline
						? new Date(applicationDeadline)
						: undefined,
		});
	});
