import { ORPCError } from "@orpc/client";
import { getConsentItems } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

const listConsentItemsSchema = z.object({
	organizationId: z.string(),
});

export const listConsentItemsProcedure = protectedProcedure
	.route({ method: "GET", path: "/consent-items", tags: ["Consent Items"] })
	.input(listConsentItemsSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getConsentItems(input.organizationId);
	});
