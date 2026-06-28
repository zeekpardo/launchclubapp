import { ORPCError } from "@orpc/client";
import { getCustomFieldValues, getPersonById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const listCustomFieldValuesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/custom-fields/values",
		tags: ["CustomFields"],
	})
	.input(z.object({ organizationId: z.string(), personId: z.string() }))
	.handler(async ({ input, context }) => {
		await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		// The person must belong to the caller's org before listing their values.
		const person = await getPersonById(input.personId);
		if (!person || person.organizationId !== input.organizationId)
			throw new ORPCError("NOT_FOUND");
		return getCustomFieldValues(input.personId);
	});
