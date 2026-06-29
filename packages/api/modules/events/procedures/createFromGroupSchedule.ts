import { ORPCError } from "@orpc/client";
import {
	batchCreateEvents,
	getEventsByGroup,
	getGroupById,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { authorizeEventGroups } from "../lib/authorize";
import { expandGroupSchedule } from "../lib/group-schedule";
import { createEventsFromGroupScheduleSchema } from "../types";

export const createEventsFromGroupScheduleProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/events/from-group-schedule",
		tags: ["Events"],
		summary: "Generate attendance events from a group's meeting schedule",
	})
	.input(createEventsFromGroupScheduleSchema)
	.handler(async ({ input, context }) => {
		await authorizeEventGroups(context.user.id, context.user.role, [
			input.groupId,
		]);

		const group = await getGroupById(input.groupId);
		if (!group) throw new ORPCError("NOT_FOUND");

		const expanded = expandGroupSchedule(group);
		if (!expanded.ok) {
			throw new ORPCError("BAD_REQUEST", { message: expanded.reason });
		}

		// Skip dates that already have an event for this group (idempotent re-run).
		const existing = await getEventsByGroup(input.groupId);
		const existingKeys = new Set(existing.map((e) => e.startsAt.getTime()));

		const toCreate = expanded.occurrences.filter(
			(o) => !existingKeys.has(o.startsAt.getTime()),
		);

		if (toCreate.length === 0) {
			return { count: 0, skipped: expanded.occurrences.length };
		}

		const result = await batchCreateEvents(
			toCreate.map(({ startsAt, endsAt }) => ({
				groupIds: [input.groupId],
				name: group.name,
				eventType: "regular",
				startsAt,
				endsAt,
			})),
		);

		return {
			count: result.count,
			skipped: expanded.occurrences.length - toCreate.length,
		};
	});
