---
name: lc-api-people
description: oRPC procedures for People, Households, and Guardians. Blocked by lc-schema.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-api-people — People, Households & Guardians API Agent

**Prerequisite**: lc-schema must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `packages/api/modules/people/` — create from scratch
- `packages/api/modules/households/` — create from scratch
- `packages/api/modules/guardians/` — create from scratch
- Append `people`, `households`, `guardians` keys to `packages/api/orpc/router.ts`

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read patterns

Read:
- `packages/api/orpc/procedures.ts`
- `packages/api/orpc/router.ts`
- `packages/api/modules/organizations/lib/membership.ts`

## Step 2 — Households module

### `packages/api/modules/households/types.ts`
```typescript
import { z } from "zod";

export const createHouseholdSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const updateHouseholdSchema = createHouseholdSchema.partial().extend({ id: z.string() });
```

### `packages/api/modules/households/procedures/list.ts`
```typescript
import { getHouseholdsByOrganization } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const listHouseholds = protectedProcedure
  .route({ method: "GET", path: "/households", tags: ["Households"] })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    await verifyOrganizationMembership(input.organizationId, context.user.id);
    return getHouseholdsByOrganization(input.organizationId);
  });
```

### `packages/api/modules/households/procedures/get.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getHouseholdById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getHousehold = protectedProcedure
  .route({ method: "GET", path: "/households/{id}", tags: ["Households"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const household = await getHouseholdById(input.id);
    if (!household) throw new ORPCError("NOT_FOUND");
    return household;
  });
```

### `packages/api/modules/households/procedures/create.ts`
```typescript
import { createHousehold } from "@repo/database";
import { ORPCError } from "@orpc/client";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createHouseholdSchema } from "../types";

export const createHouseholdProcedure = protectedProcedure
  .route({ method: "POST", path: "/households", tags: ["Households"] })
  .input(createHouseholdSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    return createHousehold(input);
  });
```

### `packages/api/modules/households/procedures/update.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getHouseholdById, updateHousehold } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { updateHouseholdSchema } from "../types";

export const updateHouseholdProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/households/{id}", tags: ["Households"] })
  .input(updateHouseholdSchema)
  .handler(async ({ input, context }) => {
    const household = await getHouseholdById(input.id);
    if (!household) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(household.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const { id, ...data } = input;
    return updateHousehold(id, data);
  });
```

### `packages/api/modules/households/procedures/delete.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { deleteHousehold, getHouseholdById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const deleteHouseholdProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/households/{id}", tags: ["Households"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const household = await getHouseholdById(input.id);
    if (!household) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(household.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ORPCError("FORBIDDEN");
    await deleteHousehold(input.id);
    return { success: true };
  });
```

### `packages/api/modules/households/router.ts`
```typescript
import { createHouseholdProcedure } from "./procedures/create";
import { deleteHouseholdProcedure } from "./procedures/delete";
import { getHousehold } from "./procedures/get";
import { listHouseholds } from "./procedures/list";
import { updateHouseholdProcedure } from "./procedures/update";

export const householdsRouter = {
  list: listHouseholds,
  get: getHousehold,
  create: createHouseholdProcedure,
  update: updateHouseholdProcedure,
  delete: deleteHouseholdProcedure,
};
```

## Step 3 — People module

### `packages/api/modules/people/types.ts`
```typescript
import { z } from "zod";

export const createPersonSchema = z.object({
  organizationId: z.string(),
  householdId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.string().optional(),
  isChild: z.boolean().default(false),
  notes: z.string().optional(),
});

export const updatePersonSchema = createPersonSchema.omit({ organizationId: true }).partial().extend({ id: z.string() });

export const listPeopleSchema = z.object({
  organizationId: z.string(),
  isChild: z.boolean().optional(),
  query: z.string().optional(),
});
```

### `packages/api/modules/people/procedures/list.ts`
```typescript
import { getPeopleByOrganization } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listPeopleSchema } from "../types";

export const listPeople = protectedProcedure
  .route({ method: "GET", path: "/people", tags: ["People"] })
  .input(listPeopleSchema)
  .handler(async ({ input, context }) => {
    await verifyOrganizationMembership(input.organizationId, context.user.id);
    return getPeopleByOrganization(input.organizationId, {
      isChild: input.isChild,
      query: input.query,
    });
  });
```

### `packages/api/modules/people/procedures/get.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getPersonById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getPerson = protectedProcedure
  .route({ method: "GET", path: "/people/{id}", tags: ["People"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const person = await getPersonById(input.id);
    if (!person) throw new ORPCError("NOT_FOUND");
    return person;
  });
```

### `packages/api/modules/people/procedures/create.ts`
```typescript
import { createPerson } from "@repo/database";
import { ORPCError } from "@orpc/client";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createPersonSchema } from "../types";

export const createPersonProcedure = protectedProcedure
  .route({ method: "POST", path: "/people", tags: ["People"] })
  .input(createPersonSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const { organizationId, dateOfBirth, ...data } = input;
    return createPerson({
      ...data,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });
  });
```

### `packages/api/modules/people/procedures/update.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getPersonById, updatePerson } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { updatePersonSchema } from "../types";

export const updatePersonProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/people/{id}", tags: ["People"] })
  .input(updatePersonSchema)
  .handler(async ({ input }) => {
    const person = await getPersonById(input.id);
    if (!person) throw new ORPCError("NOT_FOUND");
    const { id, dateOfBirth, ...data } = input;
    return updatePerson(id, {
      ...data,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });
  });
```

### `packages/api/modules/people/procedures/delete.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { deletePerson, getPersonById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const deletePersonProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/people/{id}", tags: ["People"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const person = await getPersonById(input.id);
    if (!person) throw new ORPCError("NOT_FOUND");
    await deletePerson(input.id);
    return { success: true };
  });
```

### `packages/api/modules/people/router.ts`
```typescript
import { createPersonProcedure } from "./procedures/create";
import { deletePersonProcedure } from "./procedures/delete";
import { getPerson } from "./procedures/get";
import { listPeople } from "./procedures/list";
import { updatePersonProcedure } from "./procedures/update";

export const peopleRouter = {
  list: listPeople,
  get: getPerson,
  create: createPersonProcedure,
  update: updatePersonProcedure,
  delete: deletePersonProcedure,
};
```

## Step 4 — Guardians module

### `packages/api/modules/guardians/procedures/add.ts`
```typescript
import { addGuardian } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const addGuardianProcedure = protectedProcedure
  .route({ method: "POST", path: "/guardians", tags: ["Guardians"] })
  .input(z.object({ personId: z.string(), kidId: z.string(), relation: z.string().optional() }))
  .handler(async ({ input }) => {
    return addGuardian(input.personId, input.kidId, input.relation);
  });
```

### `packages/api/modules/guardians/procedures/remove.ts`
```typescript
import { removeGuardian } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const removeGuardianProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/guardians", tags: ["Guardians"] })
  .input(z.object({ personId: z.string(), kidId: z.string() }))
  .handler(async ({ input }) => {
    await removeGuardian(input.personId, input.kidId);
    return { success: true };
  });
```

### `packages/api/modules/guardians/router.ts`
```typescript
import { addGuardianProcedure } from "./procedures/add";
import { removeGuardianProcedure } from "./procedures/remove";

export const guardiansRouter = {
  add: addGuardianProcedure,
  remove: removeGuardianProcedure,
};
```

## Step 5 — Register in router.ts

Read `packages/api/orpc/router.ts`, then add:
```typescript
import { householdsRouter } from "../modules/households/router";
import { peopleRouter } from "../modules/people/router";
import { guardiansRouter } from "../modules/guardians/router";
// inside router:
households: householdsRouter,
people: peopleRouter,
guardians: guardiansRouter,
```

## Completion Criteria
- All procedure files created
- All three routers exported and registered
- No TypeScript errors
