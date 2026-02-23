---
name: lc-ui-kids-guardians
description: UI pages for Kids list and Guardians management. Blocked by lc-api-people.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-ui-kids-guardians — Kids & Guardians UI Agent

**Prerequisite**: lc-api-people must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `apps/web/modules/saas/kids/` — create from scratch
- `apps/web/modules/saas/guardians/` — create from scratch
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/kids/` — route pages
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/guardians/` — route pages

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read existing patterns

Read `apps/web/modules/saas/people/` components (created by lc-ui-people agent) and a neighboring page to understand structure.

## Step 2 — Kids module

Kids are `Person` records where `isChild = true`.

### `apps/web/modules/saas/kids/hooks/use-kids.ts`
`"use client"` hook file:
- `useKids(query?)` — calls `orpc.people.list` with `{ organizationId, isChild: true, query }`
- `useCreateKid()` — calls `orpc.people.create` (with `isChild: true`)
- `useUpdateKid()` — calls `orpc.people.update`
- `useDeleteKid()` — calls `orpc.people.delete`

### `apps/web/modules/saas/kids/components/KidsTable.tsx`
`"use client"` data table for kids with columns:
- Name (linked to person profile)
- Date of Birth
- Household
- Guardian count (badge)
- Group memberships (badge)
- Actions (Edit, Delete)

Has search input (URL state via `nuqs`).
Has "+ New Kid" button that opens a dialog.

### `apps/web/modules/saas/kids/components/KidDialog.tsx`
`"use client"` dialog/form for creating or editing a kid. Same fields as PersonForm but with `isChild` fixed to `true`.

### `apps/web/modules/saas/kids/index.ts`
Export `KidsTable` and `KidDialog`.

## Step 3 — Kids route

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/kids/page.tsx`
```typescript
import { KidsTable } from "@saas/kids/components/KidsTable";
import { PageHeader } from "@saas/shared/components/PageHeader";

export default async function KidsPage() {
  return (
    <div>
      <PageHeader title="Kids" subtitle="Manage registered children" />
      <KidsTable />
    </div>
  );
}
```

## Step 4 — Guardians module

### `apps/web/modules/saas/guardians/hooks/use-guardians.ts`
`"use client"` hook:
- `useAddGuardian()` — calls `orpc.guardians.add`
- `useRemoveGuardian()` — calls `orpc.guardians.remove`

### `apps/web/modules/saas/guardians/components/GuardianManager.tsx`
`"use client"` component receiving `kidId` (a Person ID with `isChild = true`).

Shows:
- List of current guardians for this kid (from person profile data)
- "+ Add Guardian" button that opens a dialog to select an adult (filter `orpc.people.list` with `isChild: false`) and enter relation (e.g., Parent, Grandparent, Foster Parent)
- Remove button per guardian

### `apps/web/modules/saas/guardians/components/GuardiansPage.tsx`
`"use client"` overview component showing all kids and their guardian counts. Clicking a kid opens the `GuardianManager` in a sheet/dialog.

### `apps/web/modules/saas/guardians/index.ts`
Export `GuardianManager` and `GuardiansPage`.

## Step 5 — Guardians route

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/guardians/page.tsx`
```typescript
import { GuardiansPage } from "@saas/guardians/components/GuardiansPage";
import { PageHeader } from "@saas/shared/components/PageHeader";

export default async function GuardiansPageRoute() {
  return (
    <div>
      <PageHeader title="Guardians" subtitle="Manage guardian relationships" />
      <GuardiansPage />
    </div>
  );
}
```

## Key Conventions
- Named exports only
- `"use client"` only on interactive components and hooks
- Import `orpc` from `@shared/lib/orpc-query-utils`
- Use `nuqs` for URL-based search state
- Use `@repo/ui/components/sheet` for sliding panels if needed

## Completion Criteria
- KidsTable renders with search
- GuardianManager shows existing guardians and allows adding/removing
- Both `/kids` and `/guardians` routes accessible within org layout
