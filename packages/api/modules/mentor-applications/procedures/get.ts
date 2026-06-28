import { ORPCError } from "@orpc/client";
import { getMentorApplicationById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const getMentorApplication = protectedProcedure
	.route({
		method: "GET",
		path: "/mentor-applications/{id}",
		tags: ["MentorApplications"],
	})
	.input(z.object({ id: z.string() }))
	.handler(async ({ input, context }) => {
		const application = await getMentorApplicationById(input.id);
		if (!application) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			application.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return application;
	});
