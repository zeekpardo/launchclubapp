# LaunchClub — Rebuild Plan (supastarter-nextjs)

> Rebuilding LaunchClub as a true multi-tenant SaaS on supastarter-nextjs.

---

## Multi-Tenancy Architecture

```
Organization (Better Auth tenant = client org)
└── Area          (neutral region/district, replaces "Country")
    └── Site      (physical location, has a public slug for /apply)
        └── Group (program group)
            ├── People  (members / leaders via PersonGroup)
            └── Events → Attendance
```

### Role Mapping

| Better Auth Org Role | LaunchClub Role | Scope                           |
|---------------------|-----------------|--------------------------------|
| Platform `admin`    | master_admin    | All orgs (platform super-admin)|
| Org `owner`         | area_leader     | Full org CRUD                  |
| Org `admin`         | site_leader     | Their assigned sites           |
| Org `member`        | mentor          | Their assigned groups          |

Site scoping: `UserSite` table (userId ↔ siteId).
Group scoping: `PersonGroup` with `role = LEADER`.

---

## Prisma Models to Add

### Area
```prisma
model Area {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  description    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  sites          Site[]

  @@index([organizationId])
  @@map("area")
}
```

### Site
```prisma
model Site {
  id           String   @id @default(cuid())
  areaId       String
  name         String
  slug         String   @unique
  address      String?
  city         String?
  state        String?
  zipCode      String?
  phone        String?
  email        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  area         Area     @relation(fields: [areaId], references: [id], onDelete: Cascade)
  groups       Group[]
  userSites    UserSite[]
  applications Application[]

  @@index([areaId])
  @@map("site")
}
```

### UserSite (site scoping)
```prisma
model UserSite {
  userId    String
  siteId    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  site      Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@id([userId, siteId])
  @@map("user_site")
}
```

### Household
```prisma
model Household {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  address        String?
  city           String?
  state          String?
  zipCode        String?
  phone          String?
  email          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  people         Person[]

  @@index([organizationId])
  @@map("household")
}
```

### Person
```prisma
model Person {
  id          String    @id @default(cuid())
  householdId String?
  firstName   String
  lastName    String
  email       String?
  phone       String?
  dateOfBirth DateTime?
  gender      String?
  notes       String?   @db.Text
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  household   Household? @relation(fields: [householdId], references: [id], onDelete: SetNull)
  personGroups PersonGroup[]
  attendance   Attendance[]
  guardianships Guardian[] @relation("GuardianPerson")
  kids         Guardian[] @relation("GuardianKid")

  @@index([householdId])
  @@map("person")
}
```

### Group
```prisma
model Group {
  id          String   @id @default(cuid())
  siteId      String
  name        String
  description String?  @db.Text
  meetingDay  String?
  meetingTime String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  site        Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  personGroups PersonGroup[]
  events      Event[]

  @@index([siteId])
  @@map("group")
}
```

### PersonGroup (membership + leadership)
```prisma
model PersonGroup {
  personId  String
  groupId   String
  role      String   @default("MEMBER") // MEMBER | LEADER
  joinedAt  DateTime @default(now())
  person    Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@id([personId, groupId])
  @@map("person_group")
}
```

### Guardian (kids ↔ adults)
```prisma
model Guardian {
  personId  String
  kidId     String
  relation  String?
  person    Person @relation("GuardianPerson", fields: [personId], references: [id], onDelete: Cascade)
  kid       Person @relation("GuardianKid", fields: [kidId], references: [id], onDelete: Cascade)

  @@id([personId, kidId])
  @@map("guardian")
}
```

### Event
```prisma
model Event {
  id          String     @id @default(cuid())
  groupId     String
  name        String
  description String?    @db.Text
  startsAt    DateTime
  endsAt      DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  group       Group      @relation(fields: [groupId], references: [id], onDelete: Cascade)
  attendance  Attendance[]

  @@index([groupId])
  @@map("event")
}
```

### Attendance
```prisma
model Attendance {
  id        String   @id @default(cuid())
  eventId   String
  personId  String
  status    String   @default("PRESENT") // PRESENT | ABSENT | LATE | EXCUSED
  notes     String?
  createdAt DateTime @default(now())
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  person    Person   @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@unique([eventId, personId])
  @@index([eventId])
  @@index([personId])
  @@map("attendance")
}
```

### Application
```prisma
model Application {
  id          String   @id @default(cuid())
  siteId      String
  firstName   String
  lastName    String
  email       String?
  phone       String?
  message     String?  @db.Text
  status      String   @default("PENDING") // PENDING | APPROVED | REJECTED
  reviewedAt  DateTime?
  reviewedBy  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  site        Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([siteId])
  @@index([status])
  @@map("application")
}
```

---

## Agent File Structure

```
supastarter-nextjs/
├── LAUNCHCLUB_PLAN.md                      # This file
└── .claude/
    └── agents/
        ├── lc-schema.md                    # Prisma schema + DB queries
        ├── lc-api-locations.md             # oRPC: areas, sites
        ├── lc-api-groups.md                # oRPC: groups + membership
        ├── lc-api-people.md                # oRPC: people, households, kids, guardians
        ├── lc-api-events.md                # oRPC: events + attendance
        ├── lc-api-applications.md          # oRPC: public apply + admin review
        ├── lc-ui-locations.md              # Pages: areas, sites
        ├── lc-ui-groups.md                 # Pages: groups list + group detail
        ├── lc-ui-people.md                 # Pages: people directory + person profile
        ├── lc-ui-events.md                 # Pages: events list + attendance
        ├── lc-ui-applications.md           # Pages: /apply public + admin review
        ├── lc-ui-kids-guardians.md         # Pages: kids + guardians management
        └── lc-dashboard.md                 # Dashboard stats + charts
```

---

## Parallel Execution Plan

```
Phase 1 (sequential):
  lc-schema ──────────────────────────────────────────────────────┐
                                                                    │ unblocks all
Phase 2 (fully parallel — no file overlap):                        ▼
  lc-api-locations ─────────────────────── lc-ui-locations
  lc-api-groups    ─────────────────────── lc-ui-groups
  lc-api-people    ─────────────────────── lc-ui-people
                                           lc-ui-kids-guardians
  lc-api-events    ─────────────────────── lc-ui-events
  lc-api-applications ──────────────────── lc-ui-applications

Phase 3 (after all Phase 2 API agents done):
  lc-dashboard
```

---

## Key Conventions

- Default to RSC; `"use client"` only for forms/hooks/interactivity
- Named exports only, no default exports
- Interfaces over types; `as const` instead of enums in TS
- `react-hook-form` + `zod` for all forms
- `orpc` utilities from `@shared/lib/orpc-query-utils` for TanStack Query
- Never import Prisma directly in app code — use `@repo/database`
- DB queries in `packages/database/prisma/queries/[domain].ts` (export from queries/index.ts)
- All user-facing strings via `useTranslations()` (next-intl)
- Always verify org membership in protected procedures:
  ```ts
  import { verifyOrganizationMembership } from "../organizations/lib/membership"
  ```
- Import UI from `@repo/ui`, app modules from `@saas/*`, `@shared/*`

---

## Verification Steps

1. `docker compose up -d` in `supastarter-nextjs/`
2. `pnpm --filter database migrate` — all migrations apply
3. `pnpm --filter database generate` — Prisma client regenerates
4. `pnpm type-check` — no TS errors
5. `pnpm --filter web dev` — app starts, all new routes render
6. Manual smoke: create org → area → site → group → person → event → attendance
7. Visit `/apply/[siteSlug]` — public form works without auth
8. `pnpm --filter web e2e:ci` — Playwright tests pass
