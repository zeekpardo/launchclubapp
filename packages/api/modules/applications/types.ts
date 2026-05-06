import { z } from "zod";

const childSchema = z.object({
  firstName: z.string().min(1, "Child first name is required").max(100),
  lastName: z.string().min(1, "Child last name is required").max(100),
  birthday: z.string().max(20).optional(), // ISO date string
  grade: z.string().max(10).optional(),
  isPartOfChurch: z.boolean().optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  emergencyContactEmail: z.string().email().max(254).optional().or(z.literal("")),
  observationConsent: z.boolean().optional(),
  termsConsent: z.boolean().optional(),
  photoVideoConsent: z.boolean().optional(),
  photoUrl: z.string().max(500).optional(),
  profileFieldValues: z
    .array(z.object({ customFieldId: z.string().max(36).uuid(), value: z.string().max(1000) }))
    .max(50)
    .optional(),
  formFieldValues: z
    .array(z.object({ formFieldId: z.string().max(36).uuid(), value: z.string().max(1000) }))
    .max(50)
    .optional(),
});

export const submitApplicationSchema = z.object({
  siteSlug: z.string().max(200),
  parentFirstName: z.string().min(1, "First name is required").max(100),
  parentLastName: z.string().min(1, "Last name is required").max(100),
  parentEmail: z.string().email().max(254).optional().or(z.literal("")),
  parentPhone: z.string().max(30).optional(),
  parentAddressLine1: z.string().max(500).optional(),
  parentCity: z.string().max(200).optional(),
  parentStateProvince: z.string().max(200).optional(),
  parentPostalCode: z.string().max(20).optional(),
  parentCountry: z.string().max(100).optional(),
  spouseFirstName: z.string().max(100).optional(),
  spouseLastName: z.string().max(100).optional(),
  spouseEmail: z.string().email().max(254).optional().or(z.literal("")),
  spousePhone: z.string().max(30).optional(),
  children: z.array(childSchema).min(1, "At least one child is required").max(20),
  customFieldValues: z
    .array(z.object({ formFieldId: z.string().max(36).uuid(), value: z.string().max(1000) }))
    .max(50)
    .optional(),
  profileFieldValues: z
    .array(z.object({ customFieldId: z.string().max(36).uuid(), value: z.string().max(1000) }))
    .max(50)
    .optional(),
});

export const reviewApplicationSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  groupAssignments: z
    .array(z.object({ applicationChildId: z.string(), groupId: z.string() }))
    .optional(),
});

export const listApplicationsSchema = z.object({
  organizationId: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export const updateOrgApplicationSettingsSchema = z.object({
  organizationId: z.string(),
  autoMigrate: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  studentIdMode: z.enum(["manual", "auto"]).optional(),
});

export const getOrgApplicationSettingsSchema = z.object({
  organizationId: z.string(),
});
