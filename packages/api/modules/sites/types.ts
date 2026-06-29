import { z } from "zod";

export const createSiteSchema = z.object({
	areaId: z.string(),
	name: z.string().min(1),
	slug: z
		.string()
		.min(1)
		.regex(/^[a-z0-9-]+$/),
	addressLine1: z.string().optional(),
	city: z.string().optional(),
	stateProvince: z.string().optional(),
	postalCode: z.string().optional(),
	country: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional(),
	acceptApplications: z.boolean().optional(),
	applicationDeadline: z.string().optional().nullable(),
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
});

export const updateSiteSchema = createSiteSchema
	.partial()
	.extend({ id: z.string() });

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
