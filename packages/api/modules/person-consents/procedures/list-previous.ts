import { ORPCError } from "@orpc/client";
import { getPreviousYearConsents } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

const listPreviousPersonConsentsSchema = z.object({
	personId: z.string(),
	organizationId: z.string(),
});

export const listPreviousPersonConsentsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/person-consents/previous",
		tags: ["Person Consents"],
	})
	.input(listPreviousPersonConsentsSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getPreviousYearConsents(input.personId, input.organizationId);
	});
