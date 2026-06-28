import { ORPCError } from "@orpc/client";
import { addUserToSite, getAreaById, getSiteById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const assignSiteLeader = protectedProcedure
	.route({ method: "POST", path: "/sites/{siteId}/leaders", tags: ["Sites"] })
	.input(z.object({ siteId: z.string(), userId: z.string() }))
	.handler(async ({ input, context }) => {
		const site = await getSiteById(input.siteId);
		if (!site) throw new ORPCError("NOT_FOUND");
		const area = await getAreaById(site.areaId);
		if (!area) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			area.organizationId,
			context.user.id,
		);
		// Only owner, LC admin, or platform admin can assign site leaders
		const isOwner =
			membership?.role === "owner" ||
			membership?.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) throw new ORPCError("FORBIDDEN");
		return addUserToSite(input.userId, input.siteId);
	});
