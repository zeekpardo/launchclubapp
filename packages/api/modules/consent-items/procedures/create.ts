import { ORPCError } from "@orpc/client";
import { createConsentItem } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

const createConsentItemSchema = z.object({
	organizationId: z.string(),
	name: z.string().min(1).max(200),
	nameES: z.string().max(200).nullable().optional(),
	pdfKey: z.string().max(500).nullable().optional(),
	applicantType: z.enum(["STUDENT", "PARENT", "MENTOR"]),
	isActive: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
});

export const createConsentItemProcedure = protectedProcedure
	.route({ method: "POST", path: "/consent-items", tags: ["Consent Items"] })
	.input(createConsentItemSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership || !["owner", "admin"].includes(membership.role)) {
			throw new ORPCError("FORBIDDEN");
		}
		const { organizationId, ...data } = input;
		return createConsentItem({ organizationId, ...data });
	});
