import { ORPCError } from "@orpc/client";
import { createArea } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { createAreaSchema } from "../types";

export const createAreaProcedure = protectedProcedure
	.route({ method: "POST", path: "/areas", tags: ["Areas"] })
	.input(createAreaSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership || !["owner", "admin"].includes(membership.role)) {
			throw new ORPCError("FORBIDDEN");
		}
		return createArea(input);
	});
