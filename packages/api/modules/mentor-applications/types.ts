import { z } from "zod";

export const submitMentorApplicationSchema = z.object({
  orgSlug: z.string().max(200),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Valid email is required").max(254),
  phone: z.string().max(30).optional(),
  addressLine1: z.string().max(500).optional(),
  city: z.string().max(200).optional(),
  stateProvince: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  mentorContractFileUrl: z.string().max(500).optional(),
  mentorSecurityClearanceFileUrl: z.string().max(500).optional(),
  formFieldValues: z
    .array(z.object({ formFieldId: z.string().max(36), value: z.string().max(1000) }))
    .max(50)
    .optional(),
  profileFieldValues: z
    .array(z.object({ customFieldId: z.string().max(36), value: z.string().max(1000) }))
    .max(50)
    .optional(),
});

export const listMentorApplicationsSchema = z.object({
  organizationId: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export const reviewMentorApplicationSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  assignedGroupId: z.string().optional(),
});

export const mentorApplicationFileUploadUrlSchema = z.object({
  contentType: z.enum(["application/pdf", "image/jpeg", "image/jpg", "image/png"]),
  orgSlug: z.string(),
});
