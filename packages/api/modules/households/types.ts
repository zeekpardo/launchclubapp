import { z } from "zod";

export const createHouseholdSchema = z.object({
	organizationId: z.string(),
	name: z.string().min(1),
	addressLine1: z.string().optional(),
	city: z.string().optional(),
	stateProvince: z.string().optional(),
	postalCode: z.string().optional(),
	country: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional(),
});

export const updateHouseholdSchema = createHouseholdSchema
	.partial()
	.extend({ id: z.string() });
