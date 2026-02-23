---
name: lc-api-events
description: oRPC procedures for Events and Attendance. Blocked by lc-schema.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-api-events — Events & Attendance API Agent

**Prerequisite**: lc-schema must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `packages/api/modules/events/` — create from scratch
- `packages/api/modules/attendance/` — create from scratch
- Append `events`, `attendance` keys to `packages/api/orpc/router.ts`

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read patterns

Read:
- `packages/api/orpc/procedures.ts`
- `packages/api/orpc/router.ts`
- `packages/api/modules/organizations/lib/membership.ts`

## Step 2 — Events module

### `packages/api/modules/events/types.ts`
```typescript
import { z } from "zod";

export const createEventSchema = z.object({
  groupId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({ id: z.string() });
```

### `packages/api/modules/events/procedures/list.ts`
```typescript
import { getEventsByGroup } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const listEvents = protectedProcedure
  .route({ method: "GET", path: "/events", tags: ["Events"] })
  .input(z.object({ groupId: z.string() }))
  .handler(async ({ input }) => {
    return getEventsByGroup(input.groupId);
  });
```

### `packages/api/modules/events/procedures/get.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getEventById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getEvent = protectedProcedure
  .route({ method: "GET", path: "/events/{id}", tags: ["Events"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const event = await getEventById(input.id);
    if (!event) throw new ORPCError("NOT_FOUND");
    return event;
  });
```

### `packages/api/modules/events/procedures/create.ts`
```typescript
import { createEvent, getGroupById, getSiteById, getAreaById } from "@repo/database";
import { ORPCError } from "@orpc/client";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createEventSchema } from "../types";

export const createEventProcedure = protectedProcedure
  .route({ method: "POST", path: "/events", tags: ["Events"] })
  .input(createEventSchema)
  .handler(async ({ input, context }) => {
    const group = await getGroupById(input.groupId);
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    return createEvent({
      ...input,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    });
  });
```

### `packages/api/modules/events/procedures/update.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { getEventById, updateEvent } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { updateEventSchema } from "../types";

export const updateEventProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/events/{id}", tags: ["Events"] })
  .input(updateEventSchema)
  .handler(async ({ input }) => {
    const event = await getEventById(input.id);
    if (!event) throw new ORPCError("NOT_FOUND");
    const { id, startsAt, endsAt, ...rest } = input;
    return updateEvent(id, {
      ...rest,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
    });
  });
```

### `packages/api/modules/events/procedures/delete.ts`
```typescript
import { ORPCError } from "@orpc/client";
import { deleteEvent, getEventById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteEventProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/events/{id}", tags: ["Events"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const event = await getEventById(input.id);
    if (!event) throw new ORPCError("NOT_FOUND");
    await deleteEvent(input.id);
    return { success: true };
  });
```

### `packages/api/modules/events/router.ts`
```typescript
import { createEventProcedure } from "./procedures/create";
import { deleteEventProcedure } from "./procedures/delete";
import { getEvent } from "./procedures/get";
import { listEvents } from "./procedures/list";
import { updateEventProcedure } from "./procedures/update";

export const eventsRouter = {
  list: listEvents,
  get: getEvent,
  create: createEventProcedure,
  update: updateEventProcedure,
  delete: deleteEventProcedure,
};
```

## Step 3 — Attendance module

### `packages/api/modules/attendance/procedures/list.ts`
```typescript
import { getAttendanceByEvent } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const listAttendance = protectedProcedure
  .route({ method: "GET", path: "/attendance", tags: ["Attendance"] })
  .input(z.object({ eventId: z.string() }))
  .handler(async ({ input }) => {
    return getAttendanceByEvent(input.eventId);
  });
```

### `packages/api/modules/attendance/procedures/record.ts`
```typescript
import { batchUpsertAttendance } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

const attendanceRecordSchema = z.object({
  eventId: z.string(),
  personId: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  notes: z.string().optional(),
});

export const recordAttendance = protectedProcedure
  .route({ method: "POST", path: "/attendance/batch", tags: ["Attendance"] })
  .input(z.object({ records: z.array(attendanceRecordSchema) }))
  .handler(async ({ input }) => {
    return batchUpsertAttendance(input.records);
  });
```

### `packages/api/modules/attendance/procedures/report.ts`
```typescript
import { getAttendanceRateByGroup } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const attendanceReport = protectedProcedure
  .route({ method: "GET", path: "/attendance/report", tags: ["Attendance"] })
  .input(z.object({ groupId: z.string(), since: z.string().datetime().optional() }))
  .handler(async ({ input }) => {
    const rate = await getAttendanceRateByGroup(
      input.groupId,
      input.since ? new Date(input.since) : undefined,
    );
    return { rate };
  });
```

### `packages/api/modules/attendance/router.ts`
```typescript
import { listAttendance } from "./procedures/list";
import { recordAttendance } from "./procedures/record";
import { attendanceReport } from "./procedures/report";

export const attendanceRouter = {
  list: listAttendance,
  record: recordAttendance,
  report: attendanceReport,
};
```

## Step 4 — Register in router.ts

Read `packages/api/orpc/router.ts`, then add:
```typescript
import { eventsRouter } from "../modules/events/router";
import { attendanceRouter } from "../modules/attendance/router";
// inside router:
events: eventsRouter,
attendance: attendanceRouter,
```

## Completion Criteria
- All procedure files created
- Both routers exported and registered
- No TypeScript errors
