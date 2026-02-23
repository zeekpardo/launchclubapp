// Maps English day names (stored in DB) to their day-of-week index.
// 2023-01-01 = Sunday, so adding the index gives the right date.
const DAY_INDEX: Record<string, number> = {
	Sunday: 0,
	Monday: 1,
	Tuesday: 2,
	Wednesday: 3,
	Thursday: 4,
	Friday: 5,
	Saturday: 6,
};

const REF_SUNDAY = new Date(2023, 0, 1); // Known Sunday

function dateForDay(englishName: string): Date {
	const d = new Date(REF_SUNDAY);
	d.setDate(1 + (DAY_INDEX[englishName] ?? 0));
	return d;
}

/** Returns a narrow (single-letter) weekday label in the given locale. */
export function narrowDayLabel(englishName: string, locale: string): string {
	return new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
		dateForDay(englishName),
	);
}

/** Returns the full weekday name in the given locale. */
export function longDayLabel(englishName: string, locale: string): string {
	return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
		dateForDay(englishName),
	);
}

/**
 * Converts a stored comma-separated English day string ("Monday, Wednesday")
 * to a localized display string ("Lunes, Miércoles").
 */
export function formatMeetingDays(
	meetingDay: string | null | undefined,
	locale: string,
	fallback: string,
): string {
	if (!meetingDay) return fallback;
	return meetingDay
		.split(",")
		.map((d) => longDayLabel(d.trim(), locale))
		.join(", ");
}
