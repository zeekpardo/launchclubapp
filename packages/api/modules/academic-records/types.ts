import { z } from "zod";

export const listAcademicRecordsSchema = z.object({
	personId: z.string().max(36),
});

export const upsertAcademicRecordSchema = z.object({
	personId: z.string().max(36),
	schoolYear: z.string().regex(/^\d{4}-\d{4}$/),
	term: z.enum([
		"Q1",
		"Q2",
		"Q3",
		"Q4",
		"SEMESTER_1",
		"SEMESTER_2",
		"TRIMESTER_1",
		"TRIMESTER_2",
		"TRIMESTER_3",
		"ANNUAL",
	]),
	termGpa: z.number().min(0).max(4.0).nullish(),
	cumulativeGpa: z.number().min(0).max(4.0).nullish(),
	gradeLevel: z.string().max(50).nullish(),
	notes: z.string().max(5000).nullish(),
});

export const deleteAcademicRecordSchema = z.object({
	id: z.string().max(36),
	personId: z.string().max(36), // passed so we can verify org membership without an extra DB lookup
});
