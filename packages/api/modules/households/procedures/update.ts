import { ORPCError } from "@orpc/client";
import { getHouseholdById, updateHousehold } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { updateHouseholdSchema } from "../types";

export const updateHouseholdProcedure = protectedProcedure
	.route({ method: "PATCH", path: "/households/{id}", tags: ["Households"] })
	.input(updateHouseholdSchema)
	.handler(async ({ input, context }) => {
		const household = await getHouseholdById(input.id);
		if (!household) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			household.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const { id, ...data } = input;
		return updateHousehold(id, data);
	});
