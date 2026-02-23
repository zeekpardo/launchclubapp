---
name: lc-api-groups
description: oRPC procedures for Groups and PersonGroup membership. Blocked by lc-schema.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-api-groups — Groups API Agent

**Prerequisite**: lc-schema must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `packages/api/modules/groups/` — create from scratch
- Append `groups` key to `packages/api/orpc/router.ts`

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read existing patterns

Read:
- `packages/api/modules/organizations/procedures/generate-organization-slug.ts`
- `packages/api/orpc/procedures.ts`
- `packages/api/orpc/router.ts`
- `packages/api/modules/organizations/lib/membership.ts`

## Step 2 — Create Groups module

### `packages/api/modules/groups/types.ts`
```typescript
import { z } from "zod";

export const createGroupSchema = z.object({
  siteId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  meetingDay: z.string().optional(),
  meetingTime: z.string().optional(),
});

export const updateGroupSchema = createGroupSchema.partial().extend({ id: z.string() });

export const addMemberSchema = z.object({
  groupId: z.string(),
  personId: z.string(),
  role: z.enum(["MEMBER", "LEADER"]).default("MEMBER"),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
```

### `packages/api/modules/groups/procedures/list.ts`
```typescript
import { getGroupsByOrganization } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const listGroups = protectedProcedure
  .route({ method: "GET", path: "/groups", tags: ["Groups"] })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    await verifyOrganizationMembership(input.organizationId, context.user.id);
    return getGroupsByOrganization(input.organizationId);
  });
```

### `packages/api/modules/groups/procedures/get.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getGroupById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getGroup = protectedProcedure
  .route({ method: "GET", path: "/groups/{id}", tags: ["Groups"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const group = await getGroupById(input.id);
    if (!group) throw new ORPCError("NOT_FOUND");
    return group;
  });
```

### `packages/api/modules/groups/procedures/create.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { createGroup, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createGroupSchema } from "../types";

export const createGroupProcedure = protectedProcedure
  .route({ method: "POST", path: "/groups", tags: ["Groups"] })
  .input(createGroupSchema)
  .handler(async ({ input, context }) => {
    const site = await getSiteById(input.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    return createGroup(input);
  });
```

### `packages/api/modules/groups/procedures/update.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getGroupById, updateGroup, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { updateGroupSchema } from "../types";

export const updateGroupProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/groups/{id}", tags: ["Groups"] })
  .input(updateGroupSchema)
  .handler(async ({ input, context }) => {
    const group = await getGroupById(input.id);
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership || !["owner", "admin", "member"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    const { id, ...data } = input;
    return updateGroup(id, data);
  });
```

### `packages/api/modules/groups/procedures/delete.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { deleteGroup, getGroupById, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const deleteGroupProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/groups/{id}", tags: ["Groups"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const group = await getGroupById(input.id);
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    await deleteGroup(input.id);
    return { success: true };
  });
```

### `packages/api/modules/groups/procedures/add-member.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { addPersonToGroup, getGroupById, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { addMemberSchema } from "../types";

export const addMember = protectedProcedure
  .route({ method: "POST", path: "/groups/{groupId}/members", tags: ["Groups"] })
  .input(addMemberSchema)
  .handler(async ({ input, context }) => {
    const group = await getGroupById(input.groupId);
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    return addPersonToGroup(input.personId, input.groupId, input.role);
  });
```

### `packages/api/modules/groups/procedures/remove-member.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { removePersonFromGroup, getGroupById, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const removeMember = protectedProcedure
  .route({ method: "DELETE", path: "/groups/{groupId}/members/{personId}", tags: ["Groups"] })
  .input(z.object({ groupId: z.string(), personId: z.string() }))
  .handler(async ({ input, context }) => {
    const group = await getGroupById(input.groupId);
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    await removePersonFromGroup(input.personId, input.groupId);
    return { success: true };
  });
```

### `packages/api/modules/groups/router.ts`
```typescript
import { addMember } from "./procedures/add-member";
import { createGroupProcedure } from "./procedures/create";
import { deleteGroupProcedure } from "./procedures/delete";
import { getGroup } from "./procedures/get";
import { listGroups } from "./procedures/list";
import { removeMember } from "./procedures/remove-member";
import { updateGroupProcedure } from "./procedures/update";

export const groupsRouter = {
  list: listGroups,
  get: getGroup,
  create: createGroupProcedure,
  update: updateGroupProcedure,
  delete: deleteGroupProcedure,
  addMember,
  removeMember,
};
```

## Step 3 — Register in router.ts

Read `packages/api/orpc/router.ts`, then add:
```typescript
import { groupsRouter } from "../modules/groups/router";
// inside router:
groups: groupsRouter,
```

## Completion Criteria
- All procedure files created
- `groupsRouter` exported
- `groups` key in `packages/api/orpc/router.ts`
