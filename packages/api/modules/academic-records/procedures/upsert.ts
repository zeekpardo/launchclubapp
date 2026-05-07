import { ORPCError } from "@orpc/client";
import { getPersonById, upsertAcademicRecord } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { upsertAcademicRecordSchema } from "../types";

export const upsertAcademicRecordProcedure = protectedProcedure
	.route({ method: "POST", path: "/academic-records", tags: ["Academic Records"] })
	.input(upsertAcademicRecordSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(person.organizationId, context.user.id);
		if (!membership) throw new ORPCError("FORBIDDEN");
		if (
			membership.role !== "owner" &&
			membership.role !== "admin" &&
			context.user.role !== "admin"
		) {
			throw new ORPCError("FORBIDDEN");
		}
		if (person.personType !== "STUDENT") {
			throw new ORPCError("BAD_REQUEST", { message: "Academic records can only be added to students" });
		}
		return upsertAcademicRecord({ ...input, recordedById: context.user.id });
	});
