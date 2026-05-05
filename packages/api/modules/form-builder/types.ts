import { z } from "zod";

export const formFieldTypeEnum = z.enum([
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DATE",
  "SELECT",
  "CHECKBOX",
  "RADIO",
  "FILE",
  "HEADER",
]);

const fieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const fieldValidationSchema = z
  .object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  })
  .optional();

export const formFieldSchema = z.object({
  label: z.string().min(1),
  fieldKey: z.string().min(1),
  type: formFieldTypeEnum,
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(fieldOptionSchema).optional(),
  validation: fieldValidationSchema,
});

export const listAreaFieldsSchema = z.object({ areaId: z.string() });
export const listSiteFieldsSchema = z.object({ siteId: z.string() });

export const addFieldSchema = formFieldSchema.extend({
  areaId: z.string().optional(),
  siteId: z.string().optional(),
});

export const updateFieldSchema = formFieldSchema.partial().extend({
  id: z.string(),
});

export const deleteFieldSchema = z.object({ id: z.string() });

export const reorderFieldsSchema = z.object({ ids: z.array(z.string()) });
