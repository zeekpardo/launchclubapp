import { ORPCError } from "@orpc/client";
import {
	batchCreateEvents,
	getAreaById,
	getGroupById,
	getSiteById,
	getUserSiteIds,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import {
	canAccessSite,
	canManageGroup,
} from "../../organizations/lib/site-access";
import { createEventSeriesSchema, type EventRecurrence } from "../types";

const MAX_EVENTS = 200;

function toDateTime(date: string, time: string): Date {
	const [y, mo, d] = date.split("-").map(Number);
	const [h, m] = time.split(":").map(Number);
	return new Date(y, mo - 1, d, h, m);
}

function getMonthlyWeekdayDate(from: Date): Date {
	const dayOfWeek = from.getDay();
	const nthOccurrence = Math.ceil(from.getDate() / 7);
	const next = new Date(from.getFullYear(), from.getMonth() + 1, 1);
	while (next.getDay() !== dayOfWeek) next.setDate(next.getDate() + 1);
	next.setDate(next.getDate() + (nthOccurrence - 1) * 7);
	return next;
}

function advanceDate(current: Date, recurrence: EventRecurrence): Date {
	const next = new Date(current);
	if (recurrence === "daily") {
		next.setDate(next.getDate() + 1);
	} else if (recurrence === "weekday") {
		do {
			next.setDate(next.getDate() + 1);
		} while (next.getDay() === 0 || next.getDay() === 6);
	} else if (recurrence === "weekly") {
		next.setDate(next.getDate() + 7);
	} else if (recurrence === "biweekly") {
		next.setDate(next.getDate() + 14);
	} else if (recurrence === "monthly_weekday") {
		return getMonthlyWeekdayDate(next);
	} else if (recurrence === "monthly_date") {
		next.setMonth(next.getMonth() + 1);
	} else if (recurrence === "yearly") {
		next.setFullYear(next.getFullYear() + 1);
	}
	return next;
}

function generateSeriesDates(
	startDate: string,
	endDate: string,
	startTime: string,
	endTime: string | undefined,
	recurrence: EventRecurrence,
): Array<{ startsAt: Date; endsAt?: Date }> {
	if (recurrence === "never") {
		return [
			{
				startsAt: toDateTime(startDate, startTime),
				endsAt: endTime ? toDateTime(startDate, endTime) : undefined,
			},
		];
	}

	const [sy, sm, sd] = startDate.split("-").map(Number);
	const endLimit = new Date(`${endDate}T23:59:59`);
	const results: Array<{ startsAt: Date; endsAt?: Date }> = [];
	let current = new Date(sy, sm - 1, sd);

	while (current <= endLimit && results.length < MAX_EVENTS) {
		const y = current.getFullYear();
		const mo = String(current.getMonth() + 1).padStart(2, "0");
		const day = String(current.getDate()).padStart(2, "0");
		const dateStr = `${y}-${mo}-${day}`;

		results.push({
			startsAt: toDateTime(dateStr, startTime),
			endsAt: endTime ? toDateTime(dateStr, endTime) : undefined,
		});

		current = advanceDate(current, recurrence);
	}

	return results;
}

export const createEventSeriesProcedure = protectedProcedure
	.route({ method: "POST", path: "/events/series", tags: ["Events"] })
	.input(createEventSeriesSchema)
	.handler(async ({ input, context }) => {
		const group = await getGroupById(input.groupIds[0]);
		if (!group) throw new ORPCError("NOT_FOUND");
		const site = await getSiteById(group.siteId);
		if (!site) throw new ORPCError("NOT_FOUND");
		const area = await getAreaById(site.areaId);
		if (!area) throw new ORPCError("NOT_FOUND");

		const membership = await verifyOrganizationMembership(
			area.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");

		const isOwner =
			membership.role === "owner" ||
			membership.role === "admin" ||
			context.user.role === "admin";
		if (!isOwner) {
			const userSiteIds = await getUserSiteIds(context.user.id);
			if (userSiteIds.length > 0) {
				if (!(await canAccessSite(context.user.id, group.siteId)))
					throw new ORPCError("FORBIDDEN");
			} else {
				if (!(await canManageGroup(context.user.id, input.groupIds[0])))
					throw new ORPCError("FORBIDDEN");
			}
		}

		const dates = generateSeriesDates(
			input.startDate,
			input.endDate,
			input.startTime,
			input.endTime,
			input.recurrence,
		);

		const result = await batchCreateEvents(
			dates.map(({ startsAt, endsAt }) => ({
				groupIds: input.groupIds,
				name: input.name,
				description: input.description,
				eventType: input.eventType,
				guestName: input.guestName,
				guestCompany: input.guestCompany,
				guestIndustry: input.guestIndustry,
				startsAt,
				endsAt,
			})),
		);

		return { count: result.count };
	});
