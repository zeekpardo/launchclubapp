import { z } from "zod";

export const listNotificationsSchema = z.object({
  organizationId: z.string().max(36),
});

export const getUnreadCountSchema = z.object({
  organizationId: z.string().max(36),
});

export const markAsReadSchema = z.object({
  id: z.string().max(36),
});

export const markAllAsReadSchema = z.object({
  organizationId: z.string().max(36),
});
