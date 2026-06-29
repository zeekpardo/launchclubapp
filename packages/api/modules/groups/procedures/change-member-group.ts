import { ORPCError } from "@orpc/client";
import {
	getAreaById,
	getGroupById,
	getSiteById,
	getUserSiteIds,
	movePersonBetweenGroups,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import {
	canAccessSite,
	canManageGroup,
} from "../../organizations/lib/site-access";
import { changeMemberGroupSchema } from "../types";

/** Resolve a group's organization id, or throw NOT_FOUND. */
async function groupOrganizationId(groupId: string): Promise<string> {
	const group = await getGroupById(groupId);
	if (!group) throw new ORPCError("NOT_FOUND");
	const site = await getSiteById(group.siteId);
	if (!site) throw new ORPCError("NOT_FOUND");
	const area = await getAreaById(site.areaId);
	if (!area) throw new ORPCError("NOT_FOUND");
	return area.organizationId;
}

export const changeMemberGroup = protectedProcedure
	.route({
		method: "POST",
		path: "/groups/change-member-group",
		tags: ["Groups"],
		summary: "Move a person from one group to another",
	})
	.input(changeMemberGroupSchema)
	.handler(async ({ input, context }) => {
		if (input.fromGroupId === input.toGroupId) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Source and destination groups are the same.",
			});
		}

		// Both groups must belong to the same organization.
		const [fromOrg, toOrg] = await Promise.all([
			groupOrganizationId(input.fromGroupId),
			groupOrganizationId(input.toGroupId),
		]);
		if (fromOrg !== toOrg) {
			throw new ORPCError("FORBIDDEN", {
				message: "Groups belong to different organizations.",
			});
		}

		const membership = await verifyOrganizationMembership(
			fromOrg,
			context.user.id,
		);
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";

		// Non-owners must be able to manage BOTH the source and destination group
		// (site leaders gate on site access; group leaders on the specific group).
		if (!isOwner) {
			const userSiteIds = await getUserSiteIds(context.user.id);
			for (const groupId of [input.fromGroupId, input.toGroupId]) {
				const group = await getGroupById(groupId);
				if (!group) throw new ORPCError("NOT_FOUND");
				if (userSiteIds.length > 0) {
					if (!(await canAccessSite(context.user.id, group.siteId)))
						throw new ORPCError("FORBIDDEN");
				} else if (!(await canManageGroup(context.user.id, groupId))) {
					throw new ORPCError("FORBIDDEN");
				}
			}
		}

		await movePersonBetweenGroups(
			input.personId,
			input.fromGroupId,
			input.toGroupId,
			input.role,
		);
		return { success: true };
	});
