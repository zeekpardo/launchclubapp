import { ORPCError } from "@orpc/client";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";

export const getMemberRole = protectedProcedure
	.route({
		method: "GET",
		path: "/organizations/{organizationId}/members/{memberId}/role",
		tags: ["Organizations"],
	})
	.input(
		z.object({
			organizationId: z.string(),
			memberId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		const callerMembership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		const isOrgAdmin =
			callerMembership &&
			["owner", "admin"].includes(callerMembership.role);
		const isPlatformAdmin = context.user.role === "admin";
		if (!isOrgAdmin && !isPlatformAdmin) throw new ORPCError("FORBIDDEN");

		const member = await db.member.findUnique({
			where: { id: input.memberId },
		});
		if (!member || member.organizationId !== input.organizationId) {
			throw new ORPCError("NOT_FOUND");
		}

		if (member.role === "owner") {
			return { lcRole: "owner" as const, sites: [], groups: [] };
		}
		if (member.role === "admin") {
			return { lcRole: "admin" as const, sites: [], groups: [] };
		}

		// member.role === "member": determine site-leader vs group-leader
		const userSites = await db.userSite.findMany({
			where: {
				userId: member.userId,
				site: { area: { organizationId: input.organizationId } },
			},
			include: {
				site: { include: { area: true } },
			},
		});

		if (userSites.length > 0) {
			return {
				lcRole: "site-leader" as const,
				sites: userSites.map((us) => ({
					id: us.site.id,
					name: us.site.name,
					area: us.site.area
						? { id: us.site.area.id, name: us.site.area.name }
						: null,
				})),
				groups: [],
			};
		}

		const userGroups = await db.userGroup.findMany({
			where: {
				userId: member.userId,
				group: {
					site: { area: { organizationId: input.organizationId } },
				},
			},
			include: {
				group: {
					include: {
						site: { include: { area: true } },
					},
				},
			},
		});

		return {
			lcRole:
				userGroups.length > 0
					? ("group-leader" as const)
					: ("member" as const),
			sites: [],
			groups: userGroups.map((ug) => ({
				id: ug.group.id,
				name: ug.group.name,
				siteId: ug.group.siteId,
				site: ug.group.site
					? {
							id: ug.group.site.id,
							name: ug.group.site.name,
							area: ug.group.site.area
								? {
										id: ug.group.site.area.id,
										name: ug.group.site.area.name,
									}
								: null,
						}
					: null,
			})),
		};
	});
