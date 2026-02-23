---
name: lc-api-applications
description: oRPC procedures for public application form and admin review. Blocked by lc-schema.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-api-applications — Applications API Agent

**Prerequisite**: lc-schema must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `packages/api/modules/applications/` — create from scratch
- Append `applications` key to `packages/api/orpc/router.ts`

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read patterns

Read:
- `packages/api/orpc/procedures.ts`
- `packages/api/orpc/router.ts`

## Step 2 — Create Applications module

### `packages/api/modules/applications/types.ts`
```typescript
import { z } from "zod";

export const submitApplicationSchema = z.object({
  siteSlug: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
});

export const reviewApplicationSchema = z.object({
  id: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const listApplicationsSchema = z.object({
  organizationId: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});
```

### `packages/api/modules/applications/procedures/submit.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { createApplication, getSiteBySlug } from "@repo/database";
import { publicProcedure } from "../../../orpc/procedures";
import { submitApplicationSchema } from "../types";

export const submitApplication = publicProcedure
  .route({
    method: "POST",
    path: "/applications/submit",
    tags: ["Applications"],
    summary: "Submit a public application for a site",
  })
  .input(submitApplicationSchema)
  .handler(async ({ input }) => {
    const site = await getSiteBySlug(input.siteSlug);
    if (!site) throw new ORPCError("NOT_FOUND");
    const { siteSlug, ...data } = input;
    return createApplication({ siteId: site.id, ...data });
  });
```

### `packages/api/modules/applications/procedures/list.ts`
```typescript
import { getApplicationsByOrganization } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { ORPCError } from "@orpc/client";
import { protectedProcedure } from "../../../orpc/procedures";
import { listApplicationsSchema } from "../types";

export const listApplications = protectedProcedure
  .route({ method: "GET", path: "/applications", tags: ["Applications"] })
  .input(listApplicationsSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    return getApplicationsByOrganization(input.organizationId, input.status);
  });
```

### `packages/api/modules/applications/procedures/get.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getApplicationById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getApplication = protectedProcedure
  .route({ method: "GET", path: "/applications/{id}", tags: ["Applications"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const application = await getApplicationById(input.id);
    if (!application) throw new ORPCError("NOT_FOUND");
    return application;
  });
```

### `packages/api/modules/applications/procedures/review.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getApplicationById, reviewApplication } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { reviewApplicationSchema } from "../types";

export const reviewApplicationProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/applications/{id}/review", tags: ["Applications"] })
  .input(reviewApplicationSchema)
  .handler(async ({ input, context }) => {
    const application = await getApplicationById(input.id);
    if (!application) throw new ORPCError("NOT_FOUND");
    const organizationId = application.site.area.organizationId;
    const membership = await verifyOrganizationMembership(organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    return reviewApplication(input.id, input.status, context.user.id);
  });
```

### `packages/api/modules/applications/router.ts`
```typescript
import { submitApplication } from "./procedures/submit";
import { listApplications } from "./procedures/list";
import { getApplication } from "./procedures/get";
import { reviewApplicationProcedure } from "./procedures/review";

export const applicationsRouter = {
  submit: submitApplication,
  list: listApplications,
  get: getApplication,
  review: reviewApplicationProcedure,
};
```

## Step 3 — Register in router.ts

Read `packages/api/orpc/router.ts`, then add:
```typescript
import { applicationsRouter } from "../modules/applications/router";
// inside router:
applications: applicationsRouter,
```

## Completion Criteria
- All procedure files created
- `applicationsRouter` exported and registered
- `submit` uses `publicProcedure` (no auth)
- `list`, `get`, `review` use `protectedProcedure`
