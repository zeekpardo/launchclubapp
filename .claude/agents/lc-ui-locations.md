---
name: lc-ui-locations
description: UI pages and components for Areas and Sites. Blocked by lc-api-locations.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-ui-locations — Areas & Sites UI Agent

**Prerequisite**: lc-api-locations must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `apps/web/modules/saas/areas/` — create from scratch
- `apps/web/modules/saas/sites/` — create from scratch
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/areas/` — route pages
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/sites/` — route pages

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read existing patterns

Read these files to understand the UI patterns used:
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx`
- `apps/web/modules/saas/organizations/` (any component file)
- `apps/web/modules/shared/components/PageHeader.tsx` (if it exists)

Also check `apps/web/modules/saas/shared/` for any shared components.

## Step 2 — Areas module

### `apps/web/modules/saas/areas/hooks/use-areas.ts`
```typescript
"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

export function useAreas() {
  const { activeOrganization } = useActiveOrganization();
  return useQuery(
    orpc.areas.list.queryOptions({
      input: { organizationId: activeOrganization?.id ?? "" },
      enabled: !!activeOrganization?.id,
    }),
  );
}

export function useCreateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.areas.create.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["areas"] }),
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.areas.update.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["areas"] }),
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();
  return useMutation({
    ...orpc.areas.delete.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["areas"] }),
  });
}
```

### `apps/web/modules/saas/areas/components/AreaDialog.tsx`
Create a `"use client"` component using react-hook-form + zod that opens a Dialog (from `@repo/ui/components/dialog`) with fields for `name` and `description`. Accepts `area` prop (optional, for edit mode) and `organizationId`. On submit calls `useCreateArea()` or `useUpdateArea()`. Uses `useTranslations()` for all labels.

### `apps/web/modules/saas/areas/components/AreaList.tsx`
Create a `"use client"` component that:
- Calls `useAreas()`
- Renders a responsive grid of cards (use `@repo/ui/components/card`)
- Each card shows area name, description, site count
- Has Edit and Delete buttons
- Has a "+ New Area" button that opens `AreaDialog`
- Shows a skeleton loading state

### `apps/web/modules/saas/areas/index.ts`
Export `AreaList` and `AreaDialog`.

## Step 3 — Areas routes

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/areas/page.tsx`
```typescript
import { AreaList } from "@saas/areas/components/AreaList";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";

export default async function AreasPage() {
  const t = await getTranslations();
  return (
    <div>
      <PageHeader title="Areas" subtitle="Manage program areas" />
      <AreaList />
    </div>
  );
}
```

## Step 4 — Sites module

### `apps/web/modules/saas/sites/hooks/use-sites.ts`
Similar pattern to `use-areas.ts` but for sites. Call `orpc.sites.list`, `orpc.sites.create`, `orpc.sites.update`, `orpc.sites.delete`.

### `apps/web/modules/saas/sites/components/SiteDialog.tsx`
Dialog form with fields: `name`, `slug` (auto-slugified from name), `areaId` (select dropdown populated from `useAreas()`), `address`, `city`, `state`, `zipCode`, `phone`, `email`.

### `apps/web/modules/saas/sites/components/SiteList.tsx`
Responsive card grid similar to AreaList. Each card shows site name, area name, slug (as a badge), group count. "+ New Site" button opens SiteDialog. Shows skeleton on load.

### `apps/web/modules/saas/sites/index.ts`
Export `SiteList` and `SiteDialog`.

## Step 5 — Sites routes

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/sites/page.tsx`
```typescript
import { SiteList } from "@saas/sites/components/SiteList";
import { PageHeader } from "@saas/shared/components/PageHeader";

export default async function SitesPage() {
  return (
    <div>
      <PageHeader title="Sites" subtitle="Manage program sites" />
      <SiteList />
    </div>
  );
}
```

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/sites/[id]/page.tsx`
Server component that fetches site detail via `orpc.sites.get` and renders site info plus a list of groups at that site.

## Key Conventions
- `"use client"` only on hooks and interactive components
- Named exports only, no default exports
- Import `orpc` from `@shared/lib/orpc-query-utils`
- Import `useActiveOrganization` from `@saas/organizations/hooks/use-active-organization`
- Import UI from `@repo/ui/components/*`
- Use `useTranslations()` from `next-intl` for all user-facing strings
- Before writing any component, inspect a neighboring saas module for patterns

## Completion Criteria
- AreaList and SiteList render without errors
- CRUD dialogs open, submit, and invalidate queries
- Both `/areas` and `/sites` routes are accessible within the org layout
