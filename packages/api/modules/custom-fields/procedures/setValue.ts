import { ORPCError } from "@orpc/client";
import { upsertCustomFieldValue } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { setCustomFieldValueSchema } from "../types";

export const setCustomFieldValueProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/custom-fields/values",
		tags: ["CustomFields"],
	})
	.input(setCustomFieldValueSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return upsertCustomFieldValue(
			input.customFieldId,
			input.personId,
			input.value ?? null,
		);
	});
