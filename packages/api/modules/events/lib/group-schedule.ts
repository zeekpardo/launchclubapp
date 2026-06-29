/**
 * Expand a group's recurring meeting schedule into concrete event date/times.
 *
 * A group stores its schedule as:
 *  - meetingDay:       comma-separated weekday names, e.g. "Monday, Wednesday"
 *  - meetingTime:      "HH:MM" start time
 *  - meetingEndTime:   "HH:MM" end time (optional)
 *  - meetingRecurrence: weekly | biweekly | monthly | bimonthly | quarterly | as-needed
 *  - startDate / endDate: the program window the meetings span
 *
 * This differs from the event-series generator (single start date, one cadence)
 * because a group can meet on several weekdays per period.
 */

const MAX_OCCURRENCES = 200;

const WEEKDAY_INDEX: Record<string, number> = {
	sunday: 0,
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6,
};

function parseWeekdays(meetingDay: string): number[] {
	return meetingDay
		.split(",")
		.map((d) => d.trim().toLowerCase())
		.map((d) => WEEKDAY_INDEX[d])
		.filter((n): n is number => typeof n === "number");
}

function atTime(day: Date, time: string): Date {
	const [h, m] = time.split(":").map(Number);
	return new Date(
		day.getFullYear(),
		day.getMonth(),
		day.getDate(),
		h || 0,
		m || 0,
	);
}

/** First date on/after `from` whose day-of-week is `weekday`. */
function firstWeekdayOnOrAfter(from: Date, weekday: number): Date {
	const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
	const diff = (weekday - d.getDay() + 7) % 7;
	d.setDate(d.getDate() + diff);
	return d;
}

export interface GroupMeetingSchedule {
	meetingDay?: string | null;
	meetingTime?: string | null;
	meetingEndTime?: string | null;
	meetingRecurrence?: string | null;
	startDate?: Date | null;
	endDate?: Date | null;
}

export interface ScheduleValidationError {
	ok: false;
	reason: string;
}

export interface ScheduleOccurrences {
	ok: true;
	occurrences: Array<{ startsAt: Date; endsAt?: Date }>;
}

/**
 * Validate a group's schedule and expand it into concrete occurrences.
 * Returns `{ ok: false, reason }` when the schedule isn't auto-schedulable.
 */
export function expandGroupSchedule(
	group: GroupMeetingSchedule,
): ScheduleValidationError | ScheduleOccurrences {
	const recurrence = (group.meetingRecurrence ?? "weekly").trim() || "weekly";
	if (recurrence === "as-needed") {
		return {
			ok: false,
			reason: 'This group meets "as needed", so events can\'t be auto-scheduled. Set a recurrence (weekly, biweekly, monthly…) first.',
		};
	}
	if (!group.meetingDay?.trim()) {
		return { ok: false, reason: "Set the group's meeting day(s) first." };
	}
	if (!group.meetingTime?.trim()) {
		return {
			ok: false,
			reason: "Set the group's meeting start time first.",
		};
	}
	if (!group.startDate || !group.endDate) {
		return {
			ok: false,
			reason: "Set the group's start and end dates first.",
		};
	}

	const weekdays = parseWeekdays(group.meetingDay);
	if (weekdays.length === 0) {
		return { ok: false, reason: "No valid meeting day was recognized." };
	}

	const start = new Date(
		group.startDate.getFullYear(),
		group.startDate.getMonth(),
		group.startDate.getDate(),
	);
	const end = new Date(
		group.endDate.getFullYear(),
		group.endDate.getMonth(),
		group.endDate.getDate(),
		23,
		59,
		59,
	);
	if (end < start) {
		return { ok: false, reason: "End date is before the start date." };
	}

	const time = group.meetingTime.trim();
	const endTime = group.meetingEndTime?.trim() || undefined;
	const days: Date[] = [];

	if (recurrence === "weekly" || recurrence === "biweekly") {
		const stepDays = recurrence === "weekly" ? 7 : 14;
		for (const wd of weekdays) {
			let d = firstWeekdayOnOrAfter(start, wd);
			while (
				d <= end &&
				days.length < MAX_OCCURRENCES * weekdays.length
			) {
				days.push(new Date(d));
				d = new Date(d);
				d.setDate(d.getDate() + stepDays);
			}
		}
	} else {
		// monthly / bimonthly / quarterly: first matching weekday(s) each period.
		const monthStep =
			recurrence === "monthly" ? 1 : recurrence === "bimonthly" ? 2 : 3; // quarterly
		let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
		while (cursor <= end && days.length < MAX_OCCURRENCES) {
			for (const wd of weekdays) {
				const first = firstWeekdayOnOrAfter(cursor, wd);
				if (first >= start && first <= end) days.push(first);
			}
			cursor = new Date(
				cursor.getFullYear(),
				cursor.getMonth() + monthStep,
				1,
			);
		}
	}

	// Sort, cap, and attach times.
	const occurrences = days
		.sort((a, b) => a.getTime() - b.getTime())
		.slice(0, MAX_OCCURRENCES)
		.map((day) => ({
			startsAt: atTime(day, time),
			endsAt: endTime ? atTime(day, endTime) : undefined,
		}));

	if (occurrences.length === 0) {
		return {
			ok: false,
			reason: "No meeting dates fall within the group's start/end window.",
		};
	}

	return { ok: true, occurrences };
}
