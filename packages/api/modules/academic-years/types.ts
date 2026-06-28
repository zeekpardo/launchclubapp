import { z } from "zod";

export const listAcademicYearsSchema = z.object({
	organizationId: z.string().max(36),
});

export const createAcademicYearSchema = z.object({
	organizationId: z.string().max(36),
	label: z.string().regex(/^\d{4}-\d{4}$/),
	startDate: z.string().datetime().nullish(),
	endDate: z.string().datetime().nullish(),
	isActive: z.boolean().default(true),
});

export const updateAcademicYearSchema = z.object({
	id: z.string().max(36),
	label: z
		.string()
		.regex(/^\d{4}-\d{4}$/)
		.optional(),
	startDate: z.string().datetime().nullish(),
	endDate: z.string().datetime().nullish(),
	isActive: z.boolean().optional(),
});

export const deleteAcademicYearSchema = z.object({
	id: z.string().max(36),
	organizationId: z.string().max(36),
});
