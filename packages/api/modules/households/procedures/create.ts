import { ORPCError } from "@orpc/client";
import { createHousehold } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { createHouseholdSchema } from "../types";

export const createHouseholdProcedure = protectedProcedure
	.route({ method: "POST", path: "/households", tags: ["Households"] })
	.input(createHouseholdSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return createHousehold(input);
	});
