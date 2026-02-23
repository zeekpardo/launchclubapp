---
name: lc-ui-applications
description: Public /apply/[siteSlug] form and admin applications review UI. Blocked by lc-api-applications.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-ui-applications — Applications UI Agent

**Prerequisite**: lc-api-applications must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `apps/web/app/apply/[siteSlug]/` — public route (no auth required)
- `apps/web/modules/saas/applications/` — admin review components
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/applications/` — admin routes

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read existing patterns

Read:
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx`
- Any public page in `apps/web/app/(marketing)/` to understand the no-auth page structure

## Step 2 — Public application form

### `apps/web/app/apply/[siteSlug]/page.tsx`
This is a **public page** — no auth guard, no `(saas)` layout. It must work without a session.

```typescript
import { ApplicationForm } from "./ApplicationForm";
import { orpcClient } from "@shared/lib/orpc-client";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;

  // Optionally fetch site info server-side for the page title
  // If site not found, show notFound()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-2">Apply to Join</h1>
        <p className="text-muted-foreground mb-6">Fill out the form below to apply.</p>
        <ApplicationForm siteSlug={siteSlug} />
      </div>
    </div>
  );
}
```

### `apps/web/app/apply/[siteSlug]/ApplicationForm.tsx`
`"use client"` form using react-hook-form + zod:

Fields:
- `firstName` (required)
- `lastName` (required)
- `email` (optional, email validation)
- `phone` (optional)
- `message` (textarea, optional)

On submit: call `orpc.applications.submit` with `{ siteSlug, ...values }`.

Show a success message after submission (don't navigate away — show a thank you card).
Show field-level validation errors.

Use `@repo/ui/components/form`, `@repo/ui/components/input`, `@repo/ui/components/button`, `@repo/ui/components/textarea`.

No imports from `@saas/*` — this is a public page outside the saas layout.

## Step 3 — Admin review module

### `apps/web/modules/saas/applications/hooks/use-applications.ts`
`"use client"` hook file with:
- `useApplications(opts?)` — calls `orpc.applications.list` with `{ organizationId, status }`
- `useApplication(id)` — calls `orpc.applications.get`
- `useReviewApplication()` — mutation for `orpc.applications.review`

### `apps/web/modules/saas/applications/components/ApplicationsList.tsx`
`"use client"` component with:
- Status filter tabs (All, Pending, Approved, Rejected)
- Data table with columns: Name, Email, Phone, Site, Submitted, Status badge, Actions
- "Approve" and "Reject" buttons per row that call `useReviewApplication()`
- Status badges with appropriate colors (pending=yellow, approved=green, rejected=red)

### `apps/web/modules/saas/applications/components/ApplicationDetail.tsx`
`"use client"` component receiving `applicationId`. Shows full application details and Approve/Reject buttons.

### `apps/web/modules/saas/applications/index.ts`
Export `ApplicationsList` and `ApplicationDetail`.

## Step 4 — Admin routes

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/applications/page.tsx`
Server component rendering `<ApplicationsList />` with PageHeader "Applications".

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/applications/[id]/page.tsx`
Server component rendering `<ApplicationDetail applicationId={id} />`.

## Key Conventions
- Public form must NOT import from `@saas/*`
- Admin components use `useActiveOrganization()` for org context
- Named exports only
- Use `@repo/ui/components/badge` for status badges
- Use `useTranslations()` for labels

## Completion Criteria
- `/apply/[siteSlug]` renders without auth and submits successfully
- Admin applications list shows with status filter
- Approve/reject actions update application status
- Public form shows success state after submission
