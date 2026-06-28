import { ORPCError } from "@orpc/client";
import { getAreaById, getSiteById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite } from "../../organizations/lib/site-access";

export const getSite = protectedProcedure
	.route({ method: "GET", path: "/sites/{id}", tags: ["Sites"] })
	.input(z.object({ id: z.string() }))
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
		if (!isOwner && !(await canAccessSite(context.user.id, input.id))) {
			throw new ORPCError("FORBIDDEN");
		}
		return site;
	});
