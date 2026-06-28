import { ORPCError } from "@orpc/client";
import { getFormById, updateForm } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { updateFormSchema } from "../types";

export const updateFormProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/forms/{formId}",
		tags: ["Forms"],
		summary: "Update a form",
	})
	.input(updateFormSchema)
	.handler(async ({ input, context }) => {
		const form = await getFormById(input.formId);
		if (!form) throw new ORPCError("NOT_FOUND");

		const membership = await verifyOrganizationMembership(
			form.organizationId,
			context.user.id,
		);
		if (!membership || !["owner", "admin"].includes(membership.role)) {
			throw new ORPCError("FORBIDDEN");
		}

		const { formId, ...data } = input;
		return updateForm(formId, data);
	});
