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

export type PurchaseRequestCategory =
	(typeof PURCHASE_REQUEST_CATEGORIES)[number];

export const purchaseRequestItemSchema = z.object({
	item: z.string().min(1, "Item name is required"),
	url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
	amount: z.number().positive("Amount must be positive"),
	quantity: z.number().int().min(1, "Quantity must be at least 1"),
	category: z.enum(PURCHASE_REQUEST_CATEGORIES),
});

export const createPurchaseRequestSchema = z.object({
	groupId: z.string(),
	name: z.string().min(1, "Name is required"),
	description: z.string().min(1, "Description is required"),
	dueDate: z.string().datetime({ offset: true }).optional().or(z.literal("")),
	items: z.array(purchaseRequestItemSchema).min(1, "Add at least one item"),
});

export const updatePurchaseRequestSchema = z.object({
	id: z.string(),
	name: z.string().min(1).optional(),
	description: z.string().min(1).optional(),
	dueDate: z.string().datetime({ offset: true }).optional().or(z.literal("")),
	items: z.array(purchaseRequestItemSchema).min(1).optional(),
});

export const reviewPurchaseRequestSchema = z.object({
	id: z.string(),
	status: z.enum(["APPROVED", "DECLINED", "PENDING"]),
	reviewNote: z.string().optional(),
});

export type PurchaseRequestItemInput = z.infer<
	typeof purchaseRequestItemSchema
>;
export type CreatePurchaseRequestInput = z.infer<
	typeof createPurchaseRequestSchema
>;
export type UpdatePurchaseRequestInput = z.infer<
	typeof updatePurchaseRequestSchema
>;
export type ReviewPurchaseRequestInput = z.infer<
	typeof reviewPurchaseRequestSchema
>;
