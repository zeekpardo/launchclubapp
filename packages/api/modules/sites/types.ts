import { z } from "zod";

export const createSiteSchema = z.object({
  areaId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  acceptApplications: z.boolean().optional(),
  applicationDeadline: z.string().optional().nullable(),
});

export const updateSiteSchema = createSiteSchema.partial().extend({ id: z.string() });

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
