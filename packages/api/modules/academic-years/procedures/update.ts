import { ORPCError } from "@orpc/client";
import {
	deactivateOtherAcademicYears,
	getAcademicYearById,
	updateAcademicYear,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { updateAcademicYearSchema } from "../types";

export const updateAcademicYearProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/academic-years/{id}",
		tags: ["Academic Years"],
	})
	.input(updateAcademicYearSchema)
	.handler(async ({ input, context }) => {
		const year = await getAcademicYearById(input.id);
		if (!year) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			year.organizationId,
			context.user.id,
		);
		if (!membership || !["owner", "admin"].includes(membership.role))
			throw new ORPCError("FORBIDDEN");
		if (input.isActive === true) {
			await deactivateOtherAcademicYears(year.organizationId, input.id);
		}
		return updateAcademicYear(input.id, {
			label: input.label,
			startDate: input.startDate ? new Date(input.startDate) : undefined,
			endDate: input.endDate ? new Date(input.endDate) : undefined,
			isActive: input.isActive,
		});
	});
