import { ORPCError } from "@orpc/client";
import { getCustomFieldsByOrg } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const listCustomFieldsProcedure = protectedProcedure
	.route({ method: "GET", path: "/custom-fields", tags: ["CustomFields"] })
	.input(z.object({ organizationId: z.string() }))
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getCustomFieldsByOrg(input.organizationId);
	});
