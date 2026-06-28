import { createEvent } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { authorizeEventGroups } from "../lib/authorize";
import { createEventSchema } from "../types";

export const createEventProcedure = protectedProcedure
	.route({ method: "POST", path: "/events", tags: ["Events"] })
	.input(createEventSchema)
	.handler(async ({ input, context }) => {
		// Authorize EVERY target group (not just the first) since the event is
		// attached to all of them.
		await authorizeEventGroups(
			context.user.id,
			context.user.role,
			input.groupIds,
		);
		const { groupIds, startsAt, endsAt, ...rest } = input;
		return createEvent({
			groupIds,
			...rest,
			startsAt: new Date(startsAt),
			endsAt: endsAt ? new Date(endsAt) : undefined,
		});
	});
