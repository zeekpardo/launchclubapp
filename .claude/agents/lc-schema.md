---
name: lc-schema
description: LaunchClub Prisma schema + DB query files. Run this FIRST — it must complete before any API agent starts.
tools: Read, Edit, Write, Bash, Glob, Grep
model: sonnet
---

# lc-schema — LaunchClub Database Schema Agent

You are responsible for adding all LaunchClub Prisma models to the existing schema and creating DB query files. **This agent must complete before any API agent runs.**

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `packages/database/prisma/schema.prisma` — append new models
- `packages/database/prisma/queries/areas.ts` — new file
- `packages/database/prisma/queries/sites.ts` — new file
- `packages/database/prisma/queries/households.ts` — new file
- `packages/database/prisma/queries/people.ts` — new file
- `packages/database/prisma/queries/groups.ts` — new file
- `packages/database/prisma/queries/events.ts` — new file
- `packages/database/prisma/queries/attendance.ts` — new file
- `packages/database/prisma/queries/applications.ts` — new file
- `packages/database/prisma/queries/index.ts` — append exports

## Do NOT Touch
Everything else. Only append to `schema.prisma` and `queries/index.ts`. Do not modify any existing model.

---

## Step 1 — Read existing schema

Read `packages/database/prisma/schema.prisma` in full so you know the current state. Note: the `Organization` model, `User` model, `Member` model already exist — you must add relations back to them for `Area`, `Household`, and `UserSite` without modifying the core auth models (Better Auth owns those).

**Important**: Better Auth manages the auth schema. Add relations by appending fields to existing models only if Prisma requires back-relation fields. Use `@@ignore` or the simplest approach that makes Prisma happy.

Actually: for the `Organization` model you CANNOT modify it because Better Auth regenerates it. Instead, define the LaunchClub models with their `organizationId String` FK and the back-relation on the LC side only. Prisma does NOT require a back-relation field on Organization for one-to-many if you use `@relation` correctly — but actually Prisma does require both sides. Work around this by adding minimal relation fields to existing models using the following approach:

After reading the schema, add these models and also add the back-relation fields to User and Organization models at the bottom of their model definitions (Prisma allows adding fields to existing models in the same file).

## Step 2 — Append LaunchClub models to schema.prisma

Append the following to the END of `packages/database/prisma/schema.prisma`:

```prisma
// ============================================================
// LaunchClub Models
// ============================================================

model Area {
  id             String       @id @default(cuid())
  organizationId String
  name           String
  description    String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  organization   Organization @relation("OrganizationAreas", fields: [organizationId], references: [id], onDelete: Cascade)
  sites          Site[]

  @@index([organizationId])
  @@map("area")
}

model Site {
  id           String        @id @default(cuid())
  areaId       String
  name         String
  slug         String        @unique
  address      String?
  city         String?
  state        String?
  zipCode      String?
  phone        String?
  email        String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  area         Area          @relation(fields: [areaId], references: [id], onDelete: Cascade)
  groups       Group[]
  userSites    UserSite[]
  applications Application[]

  @@index([areaId])
  @@map("site")
}

model UserSite {
  userId    String
  siteId    String
  createdAt DateTime @default(now())
  user      User     @relation("UserSites", fields: [userId], references: [id], onDelete: Cascade)
  site      Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@id([userId, siteId])
  @@map("user_site")
}

model Household {
  id             String       @id @default(cuid())
  organizationId String
  name           String
  address        String?
  city           String?
  state          String?
  zipCode        String?
  phone          String?
  email          String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  organization   Organization @relation("OrganizationHouseholds", fields: [organizationId], references: [id], onDelete: Cascade)
  people         Person[]

  @@index([organizationId])
  @@map("household")
}

model Person {
  id           String      @id @default(cuid())
  householdId  String?
  firstName    String
  lastName     String
  email        String?
  phone        String?
  dateOfBirth  DateTime?
  gender       String?
  isChild      Boolean     @default(false)
  notes        String?     @db.Text
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  household    Household?  @relation(fields: [householdId], references: [id], onDelete: SetNull)
  personGroups PersonGroup[]
  attendance   Attendance[]
  guardianOf   Guardian[]  @relation("GuardianPerson")
  guardians    Guardian[]  @relation("GuardianKid")

  @@index([householdId])
  @@map("person")
}

model Guardian {
  personId String
  kidId    String
  relation String?
  person   Person  @relation("GuardianPerson", fields: [personId], references: [id], onDelete: Cascade)
  kid      Person  @relation("GuardianKid", fields: [kidId], references: [id], onDelete: Cascade)

  @@id([personId, kidId])
  @@map("guardian")
}

model Group {
  id           String        @id @default(cuid())
  siteId       String
  name         String
  description  String?       @db.Text
  meetingDay   String?
  meetingTime  String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  site         Site          @relation(fields: [siteId], references: [id], onDelete: Cascade)
  personGroups PersonGroup[]
  events       Event[]

  @@index([siteId])
  @@map("group")
}

model PersonGroup {
  personId String
  groupId  String
  role     String   @default("MEMBER")
  joinedAt DateTime @default(now())
  person   Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  group    Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@id([personId, groupId])
  @@map("person_group")
}

model Event {
  id          String       @id @default(cuid())
  groupId     String
  name        String
  description String?      @db.Text
  startsAt    DateTime
  endsAt      DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  group       Group        @relation(fields: [groupId], references: [id], onDelete: Cascade)
  attendance  Attendance[]

  @@index([groupId])
  @@map("event")
}

model Attendance {
  id        String   @id @default(cuid())
  eventId   String
  personId  String
  status    String   @default("PRESENT")
  notes     String?
  createdAt DateTime @default(now())
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  person    Person   @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@unique([eventId, personId])
  @@index([eventId])
  @@index([personId])
  @@map("attendance")
}

model Application {
  id         String    @id @default(cuid())
  siteId     String
  firstName  String
  lastName   String
  email      String?
  phone      String?
  message    String?   @db.Text
  status     String    @default("PENDING")
  reviewedAt DateTime?
  reviewedBy String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  site       Site      @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId])
  @@index([status])
  @@map("application")
}
```

## Step 3 — Add back-relations to existing models

Prisma requires back-relation fields. You need to add them to the existing `Organization` and `User` models in `schema.prisma`.

Find the `Organization` model and add these fields before the closing `}`:
```prisma
  areas      Area[]      @relation("OrganizationAreas")
  households Household[] @relation("OrganizationHouseholds")
```

Find the `User` model and add this field before the closing `}`:
```prisma
  userSites  UserSite[]  @relation("UserSites")
```

Use the Edit tool to make these targeted insertions.

## Step 4 — Create query files

### `packages/database/prisma/queries/areas.ts`

```typescript
import { db } from "../client";

export async function getAreasByOrganization(organizationId: string) {
  return db.area.findMany({
    where: { organizationId },
    include: { _count: { select: { sites: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getAreaById(id: string) {
  return db.area.findUnique({
    where: { id },
    include: { sites: true },
  });
}

export async function createArea(data: {
  organizationId: string;
  name: string;
  description?: string;
}) {
  return db.area.create({ data });
}

export async function updateArea(id: string, data: { name?: string; description?: string }) {
  return db.area.update({ where: { id }, data });
}

export async function deleteArea(id: string) {
  return db.area.delete({ where: { id } });
}
```

### `packages/database/prisma/queries/sites.ts`

```typescript
import { db } from "../client";

export async function getSitesByArea(areaId: string) {
  return db.site.findMany({
    where: { areaId },
    include: { _count: { select: { groups: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getSitesByOrganization(organizationId: string) {
  return db.site.findMany({
    where: { area: { organizationId } },
    include: { area: true, _count: { select: { groups: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getSiteById(id: string) {
  return db.site.findUnique({
    where: { id },
    include: { area: true, groups: true },
  });
}

export async function getSiteBySlug(slug: string) {
  return db.site.findUnique({ where: { slug } });
}

export async function getSitesByUser(userId: string) {
  return db.site.findMany({
    where: { userSites: { some: { userId } } },
    include: { area: true },
    orderBy: { name: "asc" },
  });
}

export async function createSite(data: {
  areaId: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}) {
  return db.site.create({ data });
}

export async function updateSite(
  id: string,
  data: Partial<Omit<Parameters<typeof createSite>[0], "areaId">>,
) {
  return db.site.update({ where: { id }, data });
}

export async function deleteSite(id: string) {
  return db.site.delete({ where: { id } });
}

export async function addUserToSite(userId: string, siteId: string) {
  return db.userSite.upsert({
    where: { userId_siteId: { userId, siteId } },
    create: { userId, siteId },
    update: {},
  });
}

export async function removeUserFromSite(userId: string, siteId: string) {
  return db.userSite.delete({ where: { userId_siteId: { userId, siteId } } });
}
```

### `packages/database/prisma/queries/households.ts`

```typescript
import { db } from "../client";

export async function getHouseholdsByOrganization(organizationId: string) {
  return db.household.findMany({
    where: { organizationId },
    include: { _count: { select: { people: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getHouseholdById(id: string) {
  return db.household.findUnique({
    where: { id },
    include: { people: true },
  });
}

export async function createHousehold(data: {
  organizationId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}) {
  return db.household.create({ data });
}

export async function updateHousehold(id: string, data: Partial<Omit<Parameters<typeof createHousehold>[0], "organizationId">>) {
  return db.household.update({ where: { id }, data });
}

export async function deleteHousehold(id: string) {
  return db.household.delete({ where: { id } });
}
```

### `packages/database/prisma/queries/people.ts`

```typescript
import { db } from "../client";

export async function getPeopleByOrganization(
  organizationId: string,
  opts?: { isChild?: boolean; query?: string },
) {
  return db.person.findMany({
    where: {
      household: { organizationId },
      ...(opts?.isChild !== undefined ? { isChild: opts.isChild } : {}),
      ...(opts?.query
        ? {
            OR: [
              { firstName: { contains: opts.query, mode: "insensitive" } },
              { lastName: { contains: opts.query, mode: "insensitive" } },
              { email: { contains: opts.query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { household: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getPersonById(id: string) {
  return db.person.findUnique({
    where: { id },
    include: {
      household: true,
      personGroups: { include: { group: { include: { site: true } } } },
      guardianOf: { include: { kid: true } },
      guardians: { include: { person: true } },
    },
  });
}

export async function createPerson(data: {
  householdId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  isChild?: boolean;
  notes?: string;
}) {
  return db.person.create({ data });
}

export async function updatePerson(id: string, data: Partial<Parameters<typeof createPerson>[0]>) {
  return db.person.update({ where: { id }, data });
}

export async function deletePerson(id: string) {
  return db.person.delete({ where: { id } });
}

export async function addGuardian(personId: string, kidId: string, relation?: string) {
  return db.guardian.upsert({
    where: { personId_kidId: { personId, kidId } },
    create: { personId, kidId, relation },
    update: { relation },
  });
}

export async function removeGuardian(personId: string, kidId: string) {
  return db.guardian.delete({ where: { personId_kidId: { personId, kidId } } });
}
```

### `packages/database/prisma/queries/groups.ts`

```typescript
import { db } from "../client";

export async function getGroupsBySite(siteId: string) {
  return db.group.findMany({
    where: { siteId },
    include: { _count: { select: { personGroups: true, events: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getGroupsByOrganization(organizationId: string) {
  return db.group.findMany({
    where: { site: { area: { organizationId } } },
    include: { site: { include: { area: true } }, _count: { select: { personGroups: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getGroupById(id: string) {
  return db.group.findUnique({
    where: { id },
    include: {
      site: { include: { area: true } },
      personGroups: { include: { person: true } },
    },
  });
}

export async function createGroup(data: {
  siteId: string;
  name: string;
  description?: string;
  meetingDay?: string;
  meetingTime?: string;
}) {
  return db.group.create({ data });
}

export async function updateGroup(id: string, data: Partial<Omit<Parameters<typeof createGroup>[0], "siteId">>) {
  return db.group.update({ where: { id }, data });
}

export async function deleteGroup(id: string) {
  return db.group.delete({ where: { id } });
}

export async function addPersonToGroup(personId: string, groupId: string, role = "MEMBER") {
  return db.personGroup.upsert({
    where: { personId_groupId: { personId, groupId } },
    create: { personId, groupId, role },
    update: { role },
  });
}

export async function removePersonFromGroup(personId: string, groupId: string) {
  return db.personGroup.delete({ where: { personId_groupId: { personId, groupId } } });
}

export async function countGroupsByOrganization(organizationId: string) {
  return db.group.count({ where: { site: { area: { organizationId } } } });
}
```

### `packages/database/prisma/queries/events.ts`

```typescript
import { db } from "../client";

export async function getEventsByGroup(groupId: string) {
  return db.event.findMany({
    where: { groupId },
    include: { _count: { select: { attendance: true } } },
    orderBy: { startsAt: "desc" },
  });
}

export async function getEventById(id: string) {
  return db.event.findUnique({
    where: { id },
    include: { group: true, attendance: { include: { person: true } } },
  });
}

export async function createEvent(data: {
  groupId: string;
  name: string;
  description?: string;
  startsAt: Date;
  endsAt?: Date;
}) {
  return db.event.create({ data });
}

export async function updateEvent(id: string, data: Partial<Omit<Parameters<typeof createEvent>[0], "groupId">>) {
  return db.event.update({ where: { id }, data });
}

export async function deleteEvent(id: string) {
  return db.event.delete({ where: { id } });
}
```

### `packages/database/prisma/queries/attendance.ts`

```typescript
import { db } from "../client";

export async function getAttendanceByEvent(eventId: string) {
  return db.attendance.findMany({
    where: { eventId },
    include: { person: true },
    orderBy: [{ person: { lastName: "asc" } }, { person: { firstName: "asc" } }],
  });
}

export async function upsertAttendance(data: {
  eventId: string;
  personId: string;
  status: string;
  notes?: string;
}) {
  return db.attendance.upsert({
    where: { eventId_personId: { eventId: data.eventId, personId: data.personId } },
    create: data,
    update: { status: data.status, notes: data.notes },
  });
}

export async function batchUpsertAttendance(
  records: Array<{ eventId: string; personId: string; status: string; notes?: string }>,
) {
  return Promise.all(records.map((r) => upsertAttendance(r)));
}

export async function getAttendanceRateByGroup(
  groupId: string,
  since?: Date,
): Promise<number> {
  const events = await db.event.findMany({
    where: { groupId, ...(since ? { startsAt: { gte: since } } : {}) },
    include: { attendance: true, group: { include: { personGroups: true } } },
  });

  if (!events.length) return 0;

  let totalExpected = 0;
  let totalPresent = 0;

  for (const event of events) {
    const memberCount = event.group.personGroups.filter((pg) => pg.role === "MEMBER").length;
    const presentCount = event.attendance.filter((a) => a.status === "PRESENT").length;
    totalExpected += memberCount;
    totalPresent += presentCount;
  }

  return totalExpected === 0 ? 0 : Math.round((totalPresent / totalExpected) * 100);
}
```

### `packages/database/prisma/queries/applications.ts`

```typescript
import { db } from "../client";

export async function getApplicationsBySite(siteId: string, status?: string) {
  return db.application.findMany({
    where: { siteId, ...(status ? { status } : {}) },
    include: { site: { include: { area: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplicationsByOrganization(organizationId: string, status?: string) {
  return db.application.findMany({
    where: { site: { area: { organizationId } }, ...(status ? { status } : {}) },
    include: { site: { include: { area: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplicationById(id: string) {
  return db.application.findUnique({
    where: { id },
    include: { site: { include: { area: true } } },
  });
}

export async function createApplication(data: {
  siteId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  message?: string;
}) {
  return db.application.create({ data });
}

export async function reviewApplication(
  id: string,
  status: "APPROVED" | "REJECTED",
  reviewedBy: string,
) {
  return db.application.update({
    where: { id },
    data: { status, reviewedBy, reviewedAt: new Date() },
  });
}

export async function countRecentApplications(organizationId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db.application.findMany({
    where: { site: { area: { organizationId } }, createdAt: { gte: since } },
    include: { site: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
```

## Step 5 — Update queries/index.ts

Append these exports to `packages/database/prisma/queries/index.ts`:

```typescript
export * from "./areas";
export * from "./sites";
export * from "./households";
export * from "./people";
export * from "./groups";
export * from "./events";
export * from "./attendance";
export * from "./applications";
```

## Step 6 — Run migrations

```bash
cd /Users/zeek/Projects/LaunchClub/supastarter-nextjs
pnpm --filter database migrate
pnpm --filter database generate
```

If `migrate` prompts for a migration name, use: `launchclub_initial`

## Completion Criteria
- All 10 models appear in the Prisma schema with no duplicate model names
- All 8 query files exist with correct exports
- `queries/index.ts` exports all new files
- `pnpm --filter database generate` exits 0
- `pnpm --filter database migrate` creates a new migration with no errors
