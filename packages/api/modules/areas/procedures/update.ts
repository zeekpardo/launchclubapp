import { ORPCError } from "@orpc/client";
import { getAreaById, updateArea } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { updateAreaSchema } from "../types";

export const updateAreaProcedure = protectedProcedure
	.route({ method: "PATCH", path: "/areas/{id}", tags: ["Areas"] })
	.input(updateAreaSchema)
	.handler(async ({ input, context }) => {
		const area = await getAreaById(input.id);
		if (!area) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			area.organizationId,
			context.user.id,
		);
		if (!membership || !["owner", "admin"].includes(membership.role)) {
			throw new ORPCError("FORBIDDEN");
		}
		const { id, ...data } = input;
		return updateArea(id, data);
	});
