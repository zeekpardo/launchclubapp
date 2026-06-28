import { z } from "zod";

export const EVENT_TYPE = ["regular", "guest", "family_site_visit"] as const;

export type EventType = (typeof EVENT_TYPE)[number];

export const EVENT_RECURRENCE = [
	"never",
	"daily",
	"weekday",
	"weekly",
	"biweekly",
	"monthly_weekday",
	"monthly_date",
	"yearly",
] as const;

export type EventRecurrence = (typeof EVENT_RECURRENCE)[number];

const guestFields = z.object({
	guestName: z.string().optional(),
	guestCompany: z.string().optional(),
	guestIndustry: z.string().optional(),
});

export const createEventSchema = z
	.object({
		groupIds: z.array(z.string()).min(1),
		name: z.string().min(1),
		description: z.string().optional(),
		eventType: z.enum(EVENT_TYPE).default("regular"),
		startsAt: z.string().datetime(),
		endsAt: z.string().datetime().optional(),
	})
	.merge(guestFields);

export const updateEventSchema = z
	.object({
		id: z.string(),
		groupIds: z.array(z.string()).min(1).optional(),
		name: z.string().min(1).optional(),
		description: z.string().optional(),
		eventType: z.enum(EVENT_TYPE).optional(),
		startsAt: z.string().datetime().optional(),
		endsAt: z.string().datetime().optional(),
	})
	.merge(guestFields.partial());

export const createEventSeriesSchema = z
	.object({
		groupIds: z.array(z.string()).min(1),
		name: z.string().min(1),
		description: z.string().optional(),
		eventType: z.enum(EVENT_TYPE).default("regular"),
		startDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Required (YYYY-MM-DD)"),
		endDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Required (YYYY-MM-DD)"),
		startTime: z.string().regex(/^\d{2}:\d{2}$/, "Required (HH:MM)"),
		endTime: z
			.string()
			.regex(/^\d{2}:\d{2}$/)
			.optional(),
		recurrence: z.enum(EVENT_RECURRENCE).default("never"),
	})
	.merge(guestFields);
