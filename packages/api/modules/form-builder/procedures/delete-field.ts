import { ORPCError } from "@orpc/client";
import { deleteFormField } from "@repo/database";
import { db } from "@repo/database/prisma/client";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { deleteFieldSchema } from "../types";

export const deleteField = protectedProcedure
	.route({
		method: "DELETE",
		path: "/form-builder/fields/{id}",
		tags: ["FormBuilder"],
	})
	.input(deleteFieldSchema)
	.handler(async ({ input, context }) => {
		const field = await db.formField.findUnique({
			where: { id: input.id },
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

		return deleteFormField(input.id);
	});
