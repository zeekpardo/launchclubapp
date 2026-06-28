import { ORPCError } from "@orpc/client";
import { getFormById } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { getFormSchema } from "../types";

export const getForm = protectedProcedure
	.route({
		method: "GET",
		path: "/forms/{formId}",
		tags: ["Forms"],
		summary: "Get a form by ID",
	})
	.input(getFormSchema)
	.handler(async ({ input, context }) => {
		const form = await getFormById(input.formId);
		if (!form) throw new ORPCError("NOT_FOUND");
		await verifyOrganizationMembership(
			form.organizationId,
			context.user.id,
		);
		return form;
	});
