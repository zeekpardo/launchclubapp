import { ORPCError } from "@orpc/client";
import { getSitesByOrganization } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const listOrgSites = protectedProcedure
	.route({
		method: "GET",
		path: "/organizations/{organizationId}/sites",
		tags: ["Organizations"],
	})
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);

		if (!membership && context.user.role !== "admin") {
			throw new ORPCError("FORBIDDEN");
		}

		return getSitesByOrganization(input.organizationId);
	});
