import { ORPCError } from "@orpc/client";
import { getFormById, getFormFields } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { listFormFieldsSchema } from "../types";

export const listFormFields = protectedProcedure
	.route({
		method: "GET",
		path: "/form-builder/fields",
		tags: ["FormBuilder"],
	})
	.input(listFormFieldsSchema)
	.handler(async ({ input, context }) => {
		const form = await getFormById(input.formId);
		if (!form) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			form.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getFormFields(input.formId);
	});
