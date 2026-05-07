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
  "PROFILE",
  "CUSTOM",
  "SITE_SELECTOR",
  "CONSENT",
]);

export const personTypeEnum = z.enum(["STUDENT", "PARENT", "MENTOR"]);

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
  label: z.string(),
  fieldKey: z.string(),
  type: formFieldTypeEnum,
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(fieldOptionSchema).optional(),
  validation: fieldValidationSchema,
  profileFieldKey: z.string().optional(),
  customFieldId: z.string().optional(),
  targetPersonType: personTypeEnum.optional(),
});

export const listFormFieldsSchema = z.object({ formId: z.string() });

/** @deprecated — kept for backward compat while UI migrates to formId-scoped endpoints */
export const listAreaFieldsSchema = z.object({ areaId: z.string() });
/** @deprecated */
export const listSiteFieldsSchema = z.object({ siteId: z.string() });
/** @deprecated */
export const listOrgFieldsSchema = z.object({ organizationId: z.string() });

export const addFieldSchema = formFieldSchema.extend({
  formId: z.string(),
  consentItemId: z.string().optional(),
});

export const updateFieldSchema = formFieldSchema.partial().extend({
  id: z.string(),
  consentItemId: z.string().optional().nullable(),
});

export const deleteFieldSchema = z.object({ id: z.string() });

export const reorderFieldsSchema = z.object({ ids: z.array(z.string()) });
