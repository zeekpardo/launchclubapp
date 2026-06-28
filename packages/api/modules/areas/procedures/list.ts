import { getAreasByOrganization } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const listAreas = protectedProcedure
	.route({ method: "GET", path: "/areas", tags: ["Areas"] })
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		return getAreasByOrganization(input.organizationId);
	});
