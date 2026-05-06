import { z } from "zod";

export const listPersonConsentsSchema = z.object({
  personId: z.string(),
  academicYearId: z.string(),
});

export const upsertPersonConsentSchema = z.object({
  personId: z.string(),
  academicYearId: z.string(),
  consentType: z.enum(["OBSERVATION", "TERMS_AND_CONDITIONS", "PHOTO_VIDEO"]),
  granted: z.boolean(),
  grantedAt: z.string().nullable(),
  signatureFileUrl: z.string().nullable(),
});

export const createConsentSignatureUploadUrlSchema = z.object({
  personId: z.string(),
  fileName: z.string(),
  contentType: z.string(),
});
