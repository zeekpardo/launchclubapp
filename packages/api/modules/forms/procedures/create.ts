import { ORPCError } from "@orpc/client";
import { assignSitesToForm, createForm } from "@repo/database";
import { nanoid } from "nanoid";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { createFormSchema } from "../types";

export const createFormProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/forms",
		tags: ["Forms"],
		summary: "Create a new form",
	})
	.input(createFormSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership || !["owner", "admin"].includes(membership.role)) {
			throw new ORPCError("FORBIDDEN");
		}

		const slug = nanoid(8);

		const form = await createForm({
			organizationId: input.organizationId,
			slug,
			name: input.name,
			description: input.description,
			type: input.type,
			status: "UNPUBLISHED",
		});

		await assignSitesToForm(form.id, input.siteIds);

		return form;
	});
