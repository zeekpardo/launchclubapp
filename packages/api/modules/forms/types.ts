import { z } from "zod";

export const createFormSchema = z.object({
	organizationId: z.string(),
	name: z.string().min(1),
	type: z.enum(["STUDENT", "MENTOR"]),
	siteIds: z.array(z.string()).min(1, "At least one site is required"),
	description: z.string().optional(),
});

export const listFormsSchema = z.object({
	organizationId: z.string(),
});

export const getFormSchema = z.object({
	formId: z.string(),
});

export const updateFormSchema = z.object({
	formId: z.string(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	status: z.enum(["PUBLISHED", "UNPUBLISHED"]).optional(),
});

export const softDeleteFormSchema = z.object({
	formId: z.string(),
});

export const assignSitesSchema = z.object({
	formId: z.string(),
	siteIds: z.array(z.string()),
});

export const publicGetFormSchema = z.object({
	orgSlug: z.string(),
	formSlug: z.string(),
});

export const publicConsentUploadUrlSchema = z.object({
	consentItemId: z.string(),
});

export const publicFormFieldUploadUrlSchema = z.object({
	contentType: z.enum([
		"image/jpeg",
		"image/jpg",
		"image/png",
		"application/pdf",
	]),
});

export const publicSubmitFormSchema = z.object({
	orgSlug: z.string(),
	formSlug: z.string(),
	siteId: z.string().optional(),
	// For STUDENT forms
	parentFields: z.record(z.string(), z.string()).optional(),
	students: z.array(z.record(z.string(), z.string())).optional(),
	// For MENTOR forms
	fields: z.record(z.string(), z.string()).optional(),
});
