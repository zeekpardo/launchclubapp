import { z } from "zod";

export const createPersonSchema = z.object({
  organizationId: z.string().max(36),
  householdId: z.string().max(36).nullish(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(30).optional(),
  dateOfBirth: z.string().datetime().max(30).optional(),
  gender: z.string().max(50).optional(),
  isChild: z.boolean().default(false),
  isActive: z.boolean().default(true),
  grade: z.string().max(20).optional(),
  studentId: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  avatarUrl: z.string().max(500).optional(),
});

export const updatePersonSchema = createPersonSchema.omit({ organizationId: true }).partial().extend({ id: z.string().max(36) });

export const listPeopleSchema = z.object({
  organizationId: z.string().max(36),
  isChild: z.boolean().optional(),
  isActive: z.boolean().optional(),
  query: z.string().max(200).optional(),
  areaId: z.string().max(36).optional(),
  siteId: z.string().max(36).optional(),
});
