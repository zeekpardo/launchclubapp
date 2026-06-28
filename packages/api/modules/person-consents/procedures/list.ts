import { ORPCError } from "@orpc/client";
import { getPersonById, getPersonConsents } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { listPersonConsentsSchema } from "../types";

export const listPersonConsentsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/person-consents",
		tags: ["Person Consents"],
	})
	.input(listPersonConsentsSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			person.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getPersonConsents(input.personId, input.academicYearId);
	});
