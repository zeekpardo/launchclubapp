import { ORPCError } from "@orpc/client";
import { deleteArea, getAreaById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const deleteAreaProcedure = protectedProcedure
	.route({ method: "DELETE", path: "/areas/{id}", tags: ["Areas"] })
	.input(z.object({ id: z.string() }))
	.handler(async ({ input, context }) => {
		const area = await getAreaById(input.id);
		if (!area) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			area.organizationId,
			context.user.id,
		);
		if (!membership || membership.role !== "owner")
			throw new ORPCError("FORBIDDEN");
		await deleteArea(input.id);
		return { success: true };
	});
