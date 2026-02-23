---
name: lc-api-locations
description: oRPC procedures for Areas and Sites. Blocked by lc-schema.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-api-locations — Areas & Sites API Agent

**Prerequisite**: lc-schema must be complete (Prisma schema migrated and generated).

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `packages/api/modules/areas/` — create from scratch
- `packages/api/modules/sites/` — create from scratch
- `packages/api/orpc/router.ts` — append `areas` and `sites` keys

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read existing patterns

Read these files to understand the patterns before writing code:
- `packages/api/modules/organizations/router.ts`
- `packages/api/modules/organizations/procedures/generate-organization-slug.ts`
- `packages/api/orpc/procedures.ts`
- `packages/api/orpc/router.ts`
- `packages/api/modules/organizations/lib/membership.ts`

## Step 2 — Create Areas module

### `packages/api/modules/areas/types.ts`
```typescript
import { z } from "zod";

export const createAreaSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateAreaSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
```

### `packages/api/modules/areas/procedures/list.ts`
```typescript
import { getAreasByOrganization } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const listAreas = protectedProcedure
  .route({ method: "GET", path: "/areas", tags: ["Areas"] })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    await verifyOrganizationMembership(input.organizationId, context.user.id);
    return getAreasByOrganization(input.organizationId);
  });
```

### `packages/api/modules/areas/procedures/get.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getAreaById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getArea = protectedProcedure
  .route({ method: "GET", path: "/areas/{id}", tags: ["Areas"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const area = await getAreaById(input.id);
    if (!area) throw new ORPCError("NOT_FOUND");
    return area;
  });
```

### `packages/api/modules/areas/procedures/create.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { createArea } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createAreaSchema } from "../types";

export const createAreaProcedure = protectedProcedure
  .route({ method: "POST", path: "/areas", tags: ["Areas"] })
  .input(createAreaSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    return createArea(input);
  });
```

### `packages/api/modules/areas/procedures/update.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getAreaById, updateArea } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { updateAreaSchema } from "../types";

export const updateAreaProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/areas/{id}", tags: ["Areas"] })
  .input(updateAreaSchema)
  .handler(async ({ input, context }) => {
    const area = await getAreaById(input.id);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    const { id, ...data } = input;
    return updateArea(id, data);
  });
```

### `packages/api/modules/areas/procedures/delete.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { deleteArea, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const deleteAreaProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/areas/{id}", tags: ["Areas"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const area = await getAreaById(input.id);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership || membership.role !== "owner") throw new ORPCError("FORBIDDEN");
    await deleteArea(input.id);
    return { success: true };
  });
```

### `packages/api/modules/areas/router.ts`
```typescript
import { createAreaProcedure } from "./procedures/create";
import { deleteAreaProcedure } from "./procedures/delete";
import { getArea } from "./procedures/get";
import { listAreas } from "./procedures/list";
import { updateAreaProcedure } from "./procedures/update";

export const areasRouter = {
  list: listAreas,
  get: getArea,
  create: createAreaProcedure,
  update: updateAreaProcedure,
  delete: deleteAreaProcedure,
};
```

## Step 3 — Create Sites module

### `packages/api/modules/sites/types.ts`
```typescript
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
});

export const updateSiteSchema = createSiteSchema.partial().extend({ id: z.string() });

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
```

### `packages/api/modules/sites/procedures/list.ts`
```typescript
import { getSitesByOrganization } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const listSites = protectedProcedure
  .route({ method: "GET", path: "/sites", tags: ["Sites"] })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    await verifyOrganizationMembership(input.organizationId, context.user.id);
    return getSitesByOrganization(input.organizationId);
  });
```

### `packages/api/modules/sites/procedures/get.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getSiteById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getSite = protectedProcedure
  .route({ method: "GET", path: "/sites/{id}", tags: ["Sites"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const site = await getSiteById(input.id);
    if (!site) throw new ORPCError("NOT_FOUND");
    return site;
  });
```

### `packages/api/modules/sites/procedures/create.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { createSite, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createSiteSchema } from "../types";

export const createSiteProcedure = protectedProcedure
  .route({ method: "POST", path: "/sites", tags: ["Sites"] })
  .input(createSiteSchema)
  .handler(async ({ input, context }) => {
    const area = await getAreaById(input.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    return createSite(input);
  });
```

### `packages/api/modules/sites/procedures/update.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getSiteById, updateSite, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { updateSiteSchema } from "../types";

export const updateSiteProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/sites/{id}", tags: ["Sites"] })
  .input(updateSiteSchema)
  .handler(async ({ input, context }) => {
    const site = await getSiteById(input.id);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    const { id, ...data } = input;
    return updateSite(id, data);
  });
```

### `packages/api/modules/sites/procedures/delete.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { deleteSite, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const deleteSiteProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/sites/{id}", tags: ["Sites"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const site = await getSiteById(input.id);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership || membership.role !== "owner") throw new ORPCError("FORBIDDEN");
    await deleteSite(input.id);
    return { success: true };
  });
```

### `packages/api/modules/sites/router.ts`
```typescript
import { createSiteProcedure } from "./procedures/create";
import { deleteSiteProcedure } from "./procedures/delete";
import { getSite } from "./procedures/get";
import { listSites } from "./procedures/list";
import { updateSiteProcedure } from "./procedures/update";

export const sitesRouter = {
  list: listSites,
  get: getSite,
  create: createSiteProcedure,
  update: updateSiteProcedure,
  delete: deleteSiteProcedure,
};
```

## Step 4 — Register in router.ts

Read `packages/api/orpc/router.ts`, then append `areas` and `sites` imports and entries:

```typescript
// Add these imports at the top with other imports:
import { areasRouter } from "../modules/areas/router";
import { sitesRouter } from "../modules/sites/router";

// Add these entries inside the router:
areas: areasRouter,
sites: sitesRouter,
```

## Completion Criteria
- All files created with no TypeScript errors
- `areasRouter` and `sitesRouter` exported from their respective router files
- Both keys registered in `packages/api/orpc/router.ts`
