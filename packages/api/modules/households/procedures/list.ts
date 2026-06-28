import { getHouseholdsByOrganization } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const listHouseholds = protectedProcedure
	.route({ method: "GET", path: "/households", tags: ["Households"] })
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		return getHouseholdsByOrganization(input.organizationId);
	});
