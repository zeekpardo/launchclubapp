import { ORPCError } from "@orpc/client";
import { reorderFormFields } from "@repo/database";
import { db } from "@repo/database/prisma/client";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { reorderFieldsSchema } from "../types";

export const reorderFields = protectedProcedure
	.route({
		method: "POST",
		path: "/form-builder/fields/reorder",
		tags: ["FormBuilder"],
	})
	.input(reorderFieldsSchema)
	.handler(async ({ input, context }) => {
		if (input.ids.length === 0) return [];

		const field = await db.formField.findUnique({
			where: { id: input.ids[0] },
			include: { form: true },
		});
		if (!field) throw new ORPCError("NOT_FOUND");

		const organizationId = field.form?.organizationId;
		if (!organizationId) throw new ORPCError("NOT_FOUND");

		const membership = await verifyOrganizationMembership(
			organizationId,
			context.user.id,
		);
		if (!membership || !["owner", "admin"].includes(membership.role)) {
			throw new ORPCError("FORBIDDEN");
		}

		return reorderFormFields(input.ids);
	});
