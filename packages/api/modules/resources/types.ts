import { z } from "zod";

export const createResourceSchema = z.object({
	groupId: z.string(),
	eventId: z.string().optional(),
	name: z.string().min(1),
	url: z.string().url(),
	description: z.string().optional(),
});

export const updateResourceSchema = z.object({
	id: z.string(),
	eventId: z.string().nullable().optional(),
	name: z.string().min(1).optional(),
	url: z.string().url().optional(),
	description: z.string().optional(),
});
