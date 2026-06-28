import { ORPCError } from "@orpc/client";
import { createCustomField } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { createCustomFieldSchema } from "../types";

export const createCustomFieldProcedure = protectedProcedure
	.route({ method: "POST", path: "/custom-fields", tags: ["CustomFields"] })
	.input(createCustomFieldSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const isOwnerOrAdmin =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwnerOrAdmin) throw new ORPCError("FORBIDDEN");
		return createCustomField(input);
	});
