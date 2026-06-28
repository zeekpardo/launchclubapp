import { ORPCError } from "@orpc/client";
import { auth } from "@repo/auth";
import { addUserToGroup, addUserToSite, db, getUserByEmail } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../lib/membership";
import { assertGroupsInOrg, assertSitesInOrg } from "../lib/scope";

export const createMember = protectedProcedure
	.route({
		method: "POST",
		path: "/organizations/{organizationId}/members",
		tags: ["Organizations"],
		summary: "Directly add a user to an organization without an invite",
	})
	.input(
		z.object({
			organizationId: z.string(),
			email: z.string().email(),
			name: z.string().min(1),
			lcRole: z.enum(["admin", "site-leader", "group-leader"]),
			siteIds: z.array(z.string()).default([]),
			groupIds: z.array(z.string()).default([]),
		}),
	)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);

		const isOrgAdmin =
			membership && ["owner", "admin"].includes(membership.role);
		const isPlatformAdmin = context.user.role === "admin";

		if (!isOrgAdmin && !isPlatformAdmin) {
			throw new ORPCError("FORBIDDEN");
		}

		if (input.lcRole === "site-leader" && input.siteIds.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message: "At least one site must be selected for a Site Leader",
			});
		}

		if (input.lcRole === "group-leader" && input.groupIds.length === 0) {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"At least one group must be selected for a Group Leader",
			});
		}

		let user = await getUserByEmail(input.email);
		const isNewUser = !user;

		if (!user) {
			const now = new Date();
			user = await db.user.create({
				data: {
					name: input.name,
					email: input.email,
					emailVerified: true,
					createdAt: now,
					updatedAt: now,
				},
			});
		}

		const existingMember = await db.member.findUnique({
			where: {
				organizationId_userId: {
					organizationId: input.organizationId,
					userId: user.id,
				},
			},
		});

		if (existingMember) {
			throw new ORPCError("CONFLICT", {
				message: "User is already a member of this organization",
			});
		}

		// Map LC role to Better Auth member role
		const memberRole = input.lcRole === "admin" ? "admin" : "member";

		const member = await db.member.create({
			data: {
				organizationId: input.organizationId,
				userId: user.id,
				role: memberRole,
				createdAt: new Date(),
			},
			include: { user: true },
		});

		// Assign site access for Site Leaders
		if (input.lcRole === "site-leader") {
			await assertSitesInOrg(input.siteIds, input.organizationId);
			await Promise.all(
				input.siteIds.map((siteId) => addUserToSite(user.id, siteId)),
			);
		}

		// Assign group access for Group Leaders
		if (input.lcRole === "group-leader") {
			await assertGroupsInOrg(input.groupIds, input.organizationId);
			await Promise.all(
				input.groupIds.map((groupId) =>
					addUserToGroup(user.id, groupId),
				),
			);
		}

		// Send a magic link so the new user can sign in without needing a password.
		if (isNewUser) {
			void auth.api.signInMagicLink({
				body: { email: input.email, callbackURL: "/app" },
				headers: new Headers(),
			});
		}

		return member;
	});
