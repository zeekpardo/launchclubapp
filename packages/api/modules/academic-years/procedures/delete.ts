import { ORPCError } from "@orpc/client";
import { deleteAcademicYear, getAcademicYearById } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { deleteAcademicYearSchema } from "../types";

export const deleteAcademicYearProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/academic-years/{id}",
		tags: ["Academic Years"],
	})
	.input(deleteAcademicYearSchema)
	.handler(async ({ input, context }) => {
		const year = await getAcademicYearById(input.id);
		if (!year) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership || !["owner", "admin"].includes(membership.role))
			throw new ORPCError("FORBIDDEN");
		await deleteAcademicYear(input.id);
		return { success: true };
	});
