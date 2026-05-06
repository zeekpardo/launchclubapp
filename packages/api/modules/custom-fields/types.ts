import { z } from "zod";

export const CUSTOM_FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "CHECKBOX",
  "SELECT",
  "DATE",
  "FILE",
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export const createCustomFieldSchema = z.object({
  organizationId: z.string().max(36),
  name: z.string().min(1).max(100),
  nameEs: z.string().max(100).optional().nullable(),
  type: z.enum(CUSTOM_FIELD_TYPES),
  required: z.boolean().optional().default(false),
  options: z.array(z.string().max(200)).max(100).optional().default([]),
  order: z.number().int().optional().default(0),
});

export const updateCustomFieldSchema = z.object({
  id: z.string().max(36),
  name: z.string().min(1).max(100).optional(),
  nameEs: z.string().max(100).optional().nullable(),
  required: z.boolean().optional(),
  options: z.array(z.string().max(200)).max(100).optional(),
  order: z.number().int().optional(),
  collectInApplication: z.boolean().optional(),
});

export const setCustomFieldValueSchema = z.object({
  customFieldId: z.string().max(36),
  personId: z.string().max(36),
  organizationId: z.string().max(36),
  value: z.string().max(1000).nullable().optional(),
});

export const reorderCustomFieldsSchema = z.object({
  organizationId: z.string().max(36),
  ids: z.array(z.string().max(36)).max(100),
});

export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomFieldInput = z.infer<typeof updateCustomFieldSchema>;
export type SetCustomFieldValueInput = z.infer<typeof setCustomFieldValueSchema>;
