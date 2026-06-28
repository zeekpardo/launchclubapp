import { ORPCError } from "@orpc/client";
import { deletePerson, getPersonById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const deletePersonProcedure = protectedProcedure
	.route({ method: "DELETE", path: "/people/{id}", tags: ["People"] })
	.input(z.object({ id: z.string() }))
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.id);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			person.organizationId,
			context.user.id,
		);
		if (
			!membership ||
			(membership.role !== "owner" &&
				membership.role !== "admin" &&
				context.user.role !== "admin")
		) {
			throw new ORPCError("FORBIDDEN");
		}
		await deletePerson(input.id);
		return { success: true };
	});
