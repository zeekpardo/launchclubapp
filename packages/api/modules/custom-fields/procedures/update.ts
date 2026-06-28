import { ORPCError } from "@orpc/client";
import { getCustomFieldById, updateCustomField } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { updateCustomFieldSchema } from "../types";

export const updateCustomFieldProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/custom-fields/:id",
		tags: ["CustomFields"],
	})
	.input(updateCustomFieldSchema)
	.handler(async ({ input, context }) => {
		const field = await getCustomFieldById(input.id);
		if (!field) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			field.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const isOwnerOrAdmin =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwnerOrAdmin) throw new ORPCError("FORBIDDEN");
		const { id, ...data } = input;
		return updateCustomField(id, data);
	});
