import { ORPCError } from "@orpc/client";
import { reorderCustomFields } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { reorderCustomFieldsSchema } from "../types";

export const reorderCustomFieldsProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/custom-fields/reorder",
		tags: ["CustomFields"],
	})
	.input(reorderCustomFieldsSchema)
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
		return reorderCustomFields(input.ids);
	});
