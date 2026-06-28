import { ORPCError } from "@orpc/client";
import { createSite, getAreaById } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { createSiteSchema } from "../types";

export const createSiteProcedure = protectedProcedure
	.route({ method: "POST", path: "/sites", tags: ["Sites"] })
	.input(createSiteSchema)
	.handler(async ({ input, context }) => {
		const area = await getAreaById(input.areaId);
		if (!area) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			area.organizationId,
			context.user.id,
		);
		// Only owner, LC admin, or platform admin can create sites
		const isOwner =
			membership?.role === "owner" ||
			membership?.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) throw new ORPCError("FORBIDDEN");
		const { applicationDeadline, ...rest } = input;
		return createSite({
			...rest,
			applicationDeadline: applicationDeadline
				? new Date(applicationDeadline)
				: undefined,
		});
	});
