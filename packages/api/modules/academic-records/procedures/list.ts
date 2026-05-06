import { ORPCError } from "@orpc/client";
import { getAcademicRecordsByPerson, getPersonById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listAcademicRecordsSchema } from "../types";

export const listAcademicRecordsProcedure = protectedProcedure
	.route({ method: "GET", path: "/academic-records", tags: ["Academic Records"] })
	.input(listAcademicRecordsSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(person.organizationId, context.user.id);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getAcademicRecordsByPerson(input.personId);
	});
