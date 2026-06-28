import { ORPCError } from "@orpc/client";
import { getGpaTrendByScope } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const gpaTrendProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/academic-records/gpa-trend",
		tags: ["Academic Records"],
	})
	.input(
		z.object({
			organizationId: z.string().max(36),
			siteId: z.string().max(36).optional(),
			groupId: z.string().max(36).optional(),
			schoolYear: z.string().regex(/^\d{4}-\d{4}$/),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");

		return getGpaTrendByScope({
			organizationId: input.organizationId,
			siteId: input.siteId,
			groupId: input.groupId,
			schoolYear: input.schoolYear,
		});
	});
