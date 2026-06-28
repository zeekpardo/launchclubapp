import { ORPCError } from "@orpc/client";
import { reorderConsentItems } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

const reorderConsentItemsSchema = z.object({
	organizationId: z.string(),
	items: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })),
});

export const reorderConsentItemsProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/consent-items/reorder",
		tags: ["Consent Items"],
	})
	.input(reorderConsentItemsSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership || !["owner", "admin"].includes(membership.role)) {
			throw new ORPCError("FORBIDDEN");
		}
		return reorderConsentItems(input.items);
	});
