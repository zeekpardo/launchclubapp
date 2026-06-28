import { ORPCError } from "@orpc/client";
import { deleteAcademicRecord, getPersonById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { deleteAcademicRecordSchema } from "../types";

export const deleteAcademicRecordProcedure = protectedProcedure
	.route({ method: "DELETE", path: "/academic-records/{id}", tags: ["Academic Records"] })
	.input(deleteAcademicRecordSchema)
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
		const { count } = await deleteAcademicRecord(input.id, input.personId);
		if (count === 0) throw new ORPCError("NOT_FOUND");
		return { success: true };
	});
