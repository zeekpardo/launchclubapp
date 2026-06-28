import { z } from "zod";

export const createAreaSchema = z.object({
	organizationId: z.string(),
	name: z.string().min(1),
	description: z.string().optional(),
});

export const updateAreaSchema = z.object({
	id: z.string(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
