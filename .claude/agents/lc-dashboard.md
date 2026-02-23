---
name: lc-dashboard
description: Dashboard stats, charts and widgets. Blocked by lc-api-groups, lc-api-events, lc-api-applications.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-dashboard — Dashboard Agent

**Prerequisite**: lc-api-groups, lc-api-events, and lc-api-applications must all be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `apps/web/modules/saas/dashboard/` — create from scratch
- Update `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx`

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read existing patterns

Read:
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx` (this is the file you'll update)
- `apps/web/modules/saas/organizations/components/OrganizationStart.tsx` (if it exists)
- Any existing dashboard or stat components in the codebase

Also check if recharts is already a dependency:
```bash
cat apps/web/package.json | grep recharts
```

If recharts is not installed, use a simple CSS-based progress bar for charts instead of a library to avoid dependency changes.

## Step 2 — Stat Components

### `apps/web/modules/saas/dashboard/components/StatCard.tsx`
Simple server-compatible stat card:
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, description, icon }: StatCardProps) {
  // Use @repo/ui/components/card
  // Clean, minimal design
}
```

### `apps/web/modules/saas/dashboard/components/DashboardStats.tsx`
`"use client"` component that:
- Calls `orpc.groups.list` for group count
- Calls `orpc.people.list` for people count (adults)
- Calls `orpc.people.list` with `isChild: true` for kids count
- Calls `orpc.applications.list` with `status: "PENDING"` for pending applications count

Renders 4 `StatCard` components:
1. Total Groups
2. Total Members (adults)
3. Total Kids
4. Pending Applications (with link to /applications)

### `apps/web/modules/saas/dashboard/components/AttendanceWidget.tsx`
`"use client"` component that shows a simple attendance rate display.

Since recharts may not be available, implement a clean CSS progress bar showing the attendance rate (call `orpc.attendance.report` for a sample group, or skip if no groups exist yet).

If recharts IS available, render a simple line chart of attendance over time.

### `apps/web/modules/saas/dashboard/components/ApplicationsWidget.tsx`
`"use client"` component showing recent pending applications:
- Calls `orpc.applications.list` with `status: "PENDING"`
- Shows the 5 most recent applications in a simple list
- Each row: name, site name, submitted date, Approve/Reject buttons
- "View all" link to `/applications`

### `apps/web/modules/saas/dashboard/index.ts`
Export all components.

## Step 3 — Update org landing page

Read `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx` in full.

Replace the content section (keep the imports and structure) to render the dashboard instead of `OrganizationStart`:

```typescript
// Replace OrganizationStart with LaunchClub dashboard components
import { DashboardStats } from "@saas/dashboard/components/DashboardStats";
import { ApplicationsWidget } from "@saas/dashboard/components/ApplicationsWidget";
import { AttendanceWidget } from "@saas/dashboard/components/AttendanceWidget";

// In the return JSX, replace <OrganizationStart /> with:
<div className="space-y-6">
  <DashboardStats />
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <AttendanceWidget />
    <ApplicationsWidget />
  </div>
</div>
```

Keep the `generateMetadata` function and org null check intact.

## Key Conventions
- Named exports only
- Dashboard stat components use `"use client"` since they call hooks
- `useActiveOrganization()` provides the `organizationId` context
- Import `orpc` from `@shared/lib/orpc-query-utils`
- Use `@repo/ui/components/card` for cards
- Show loading skeletons while data is fetching

## Completion Criteria
- Dashboard stats render with correct data
- Applications widget shows pending applications with quick-approve actions
- Org landing page shows the LaunchClub dashboard instead of the starter placeholder
- No TypeScript errors
