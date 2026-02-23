import { z } from "zod";

export const PURCHASE_REQUEST_CATEGORIES = [
  "supplies",
  "snacks",
  "activities",
  "equipment",
  "field_trips",
  "guest_speakers",
  "other",
] as const;

export type PurchaseRequestCategory = (typeof PURCHASE_REQUEST_CATEGORIES)[number];

export const createPurchaseRequestSchema = z.object({
  groupId: z.string(),
  item: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  amount: z.number().positive(),
  category: z.enum(PURCHASE_REQUEST_CATEGORIES),
  justification: z.string().min(1),
});

export const updatePurchaseRequestSchema = z.object({
  id: z.string(),
  item: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  url: z.string().url().optional().nullable().or(z.literal("")),
  amount: z.number().positive().optional(),
  category: z.enum(PURCHASE_REQUEST_CATEGORIES).optional(),
  justification: z.string().min(1).optional(),
});

export const reviewPurchaseRequestSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "DECLINED", "PENDING"]),
  reviewNote: z.string().optional(),
});

export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;
export type UpdatePurchaseRequestInput = z.infer<typeof updatePurchaseRequestSchema>;
export type ReviewPurchaseRequestInput = z.infer<typeof reviewPurchaseRequestSchema>;
