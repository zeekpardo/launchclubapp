import { ORPCError } from "@orpc/client";
import { getOrganizationMembersForMentions } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listMentionableUsersSchema } from "../types";

export const listMentionableUsersProcedure = protectedProcedure
	.route({ method: "GET", path: "/person-notes/mentionable-users", tags: ["Person Notes"] })
	.input(listMentionableUsersSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getOrganizationMembersForMentions(input.organizationId);
	});
