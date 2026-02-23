---
name: lc-ui-events
description: UI pages for Events list and event management. Blocked by lc-api-events.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-ui-events — Events UI Agent

**Prerequisite**: lc-api-events must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `apps/web/modules/saas/events/` — create from scratch
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/events/` — route pages

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read existing patterns

Inspect neighboring saas module components before writing code.

## Step 2 — Hooks

### `apps/web/modules/saas/events/hooks/use-events.ts`
`"use client"` hook file with:
- `useEvents(groupId)` — calls `orpc.events.list` with `{ groupId }`
- `useEvent(id)` — calls `orpc.events.get`
- `useCreateEvent()` — mutation
- `useUpdateEvent()` — mutation
- `useDeleteEvent()` — mutation

## Step 3 — Components

### `apps/web/modules/saas/events/components/EventForm.tsx`
`"use client"` form (react-hook-form + zod) with fields:
- `name` (required)
- `groupId` (select from groups list via `orpc.groups.list`)
- `description` (textarea)
- `startsAt` (datetime-local input)
- `endsAt` (datetime-local input, optional)

### `apps/web/modules/saas/events/components/EventCard.tsx`
Card showing: event name, group name, start date/time, attendance count. Links to event detail. Has Edit and Delete actions.

### `apps/web/modules/saas/events/components/EventList.tsx`
`"use client"` component receiving `groupId`:
- Calls `useEvents(groupId)`
- Renders list of `EventCard` components
- "+ New Event" button opens `EventDialog`
- Shows empty state when no events

### `apps/web/modules/saas/events/components/EventDialog.tsx`
`"use client"` dialog wrapping `EventForm`. Supports create and edit modes. Calls `useCreateEvent()` or `useUpdateEvent()` on submit.

### `apps/web/modules/saas/events/index.ts`
Export all components.

## Step 4 — Routes

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/events/page.tsx`
Server component. Since events are scoped to groups, this page shows a group selector + event list, or an overview of all upcoming events across all groups.

Render a `"use client"` wrapper that:
1. Loads all groups via `orpc.groups.list`
2. Has a group selector (select input or tabs)
3. Shows `EventList` for the selected group

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/events/new/page.tsx`
Page with `EventForm` in create mode. On success navigates back.

## Key Conventions
- Named exports only
- `"use client"` only on hooks and interactive components
- Use `useTranslations()` for labels
- Use `@repo/ui/components/card` for EventCard
- Use `@repo/ui/components/select` for group selector

## Completion Criteria
- EventList renders with group selector
- EventDialog opens and submits
- Events CRUD works end-to-end
- Routes accessible within org layout
