import { ORPCError } from "@orpc/client";
import { db, upsertOrgApplicationSettings } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { updateOrgApplicationSettingsSchema } from "../types";

export const updateOrgApplicationSettingsProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/applications/org-settings",
		tags: ["Applications"],
		summary: "Update organization-level application settings",
	})
	.input(updateOrgApplicationSettingsSchema)
	.handler(async ({ input, context }) => {
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) throw new ORPCError("FORBIDDEN");

		const { organizationId, ...data } = input;
		const result = await upsertOrgApplicationSettings(organizationId, data);

		if (input.studentIdMode === "auto") {
			const unassigned = await db.person.findMany({
				where: {
					organizationId: input.organizationId,
					personType: "STUDENT",
					studentId: null,
				},
				select: { id: true },
			});

			for (const child of unassigned) {
				try {
					let studentId: string | null = null;
					for (let i = 0; i < 10; i++) {
						const candidate = String(
							Math.floor(100000 + Math.random() * 900000),
						);
						const exists = await db.person.findFirst({
							where: {
								organizationId: input.organizationId,
								studentId: candidate,
							},
							select: { id: true },
						});
						if (!exists) {
							studentId = candidate;
							break;
						}
					}
					if (studentId) {
						await db.person.update({
							where: { id: child.id },
							data: { studentId },
						});
					}
				} catch {
					// silently skip — backfill failure for one child should not abort the rest
				}
			}
		}

		return result;
	});
