---
name: lc-ui-people
description: UI pages for People directory and Person profiles. Blocked by lc-api-people.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-ui-people — People UI Agent

**Prerequisite**: lc-api-people must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `apps/web/modules/saas/people/` — create from scratch
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/people/` — route pages

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read existing patterns

Inspect a neighboring saas module component (e.g., settings or organizations) before writing code.

## Step 2 — Hooks

### `apps/web/modules/saas/people/hooks/use-people.ts`
`"use client"` hook file with:
- `usePeople(opts?)` — calls `orpc.people.list` with `{ organizationId, isChild: false, query }`
- `usePerson(id)` — calls `orpc.people.get`
- `useCreatePerson()` — mutation
- `useUpdatePerson()` — mutation
- `useDeletePerson()` — mutation

## Step 3 — Components

### `apps/web/modules/saas/people/components/PersonForm.tsx`
`"use client"` form (react-hook-form + zod) with fields:
- `firstName`, `lastName` (required)
- `email`, `phone` (optional)
- `dateOfBirth` (date input)
- `gender` (select: Male, Female, Other, Prefer not to say)
- `householdId` (select from households list via `orpc.households.list`)
- `notes` (textarea)

Can be used for both create and edit.

### `apps/web/modules/saas/people/components/PeopleTable.tsx`
`"use client"` data table using `@repo/ui/components/table` with columns:
- Name (first + last, linked to person profile)
- Email
- Phone
- Household
- Groups (count badge)
- Actions (Edit, Delete)

Includes a search input (`nuqs` for URL state) and filtering.
Has "+ New Person" button that navigates to `/people/new`.

### `apps/web/modules/saas/people/components/PersonProfile.tsx`
`"use client"` component receiving `personId`. Shows:
- Person details card (name, email, phone, DOB, gender)
- Household info
- Group memberships (list with role badges)
- Guardians section (if adult: kids they guard; if child: their guardians)
- Notes

### `apps/web/modules/saas/people/components/HouseholdDialog.tsx`
`"use client"` dialog for creating/editing a household with fields: `name`, `address`, `city`, `state`, `zipCode`, `phone`, `email`. Calls `orpc.households.create` or `orpc.households.update`.

### `apps/web/modules/saas/people/index.ts`
Export all components.

## Step 4 — Routes

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/people/page.tsx`
Server component rendering `<PeopleTable />` with PageHeader "People".

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/people/[id]/page.tsx`
Server component passing `params.id` to `<PersonProfile personId={id} />`.

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/people/new/page.tsx`
Server component rendering `<PersonForm />` wrapped in a page layout. On success redirects to `/people`.

## Key Conventions
- Named exports only
- `"use client"` only on hooks and interactive components
- Use `nuqs` for search/filter URL state
- Use `@repo/ui/components/table` for the data table
- Use `useTranslations()` for all labels

## Completion Criteria
- PeopleTable renders with search and filter
- PersonProfile shows all sections
- Create/edit person form submits and navigates
- All routes accessible
