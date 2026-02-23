---
name: lc-ui-groups
description: UI pages and components for Groups including detail tabs. Blocked by lc-api-groups.
tools: Read, Edit, Write, Glob, Grep
model: sonnet
---

# lc-ui-groups — Groups UI Agent

**Prerequisite**: lc-api-groups must be complete.

## Working Directory
`/Users/zeek/Projects/LaunchClub/supastarter-nextjs`

## What You Own
- `apps/web/modules/saas/groups/` — create from scratch
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/groups/` — route pages

## Do NOT Touch
Any other file outside these paths.

---

## Step 1 — Read existing patterns

Read neighboring saas modules and the org page to understand patterns:
- `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx`
- Any existing `apps/web/modules/saas/*/components/` files

## Step 2 — Hooks

### `apps/web/modules/saas/groups/hooks/use-groups.ts`
`"use client"` hook file with:
- `useGroups()` — calls `orpc.groups.list` with `{ organizationId }`
- `useGroup(id)` — calls `orpc.groups.get` with `{ id }`
- `useCreateGroup()` — mutation
- `useUpdateGroup()` — mutation
- `useDeleteGroup()` — mutation
- `useAddMember()` — mutation for `orpc.groups.addMember`
- `useRemoveMember()` — mutation for `orpc.groups.removeMember`

All mutations invalidate `["groups"]` on success.

## Step 3 — Components

### `apps/web/modules/saas/groups/components/GroupDialog.tsx`
`"use client"` dialog form with fields: `name`, `siteId` (select from `useSites()`), `description`, `meetingDay`, `meetingTime`. Supports create and edit modes.

### `apps/web/modules/saas/groups/components/GroupCard.tsx`
Card showing: group name, site name, meeting day/time, member count, event count. Links to `/groups/[id]`.

### `apps/web/modules/saas/groups/components/GroupList.tsx`
`"use client"` component that:
- Calls `useGroups()`
- Renders a grid of `GroupCard` components
- Has "+ New Group" button that opens `GroupDialog`
- Shows skeleton on load

### `apps/web/modules/saas/groups/components/GroupDetail.tsx`
`"use client"` component that receives `groupId` and renders a tabbed interface using `@repo/ui/components/tabs`:

**Tab: Members**
- Lists `group.personGroups` with person name, role badge
- "+ Add Member" button opens `AddMemberDialog`
- Remove button per member

**Tab: Events**
- Lists events for this group (use `orpc.events.list`)
- "+ New Event" button
- Click event opens attendance modal

**Tab: Attendance Report**
- Shows attendance rate (use `orpc.attendance.report`)
- Simple percentage display with a progress bar

### `apps/web/modules/saas/groups/components/AddMemberDialog.tsx`
`"use client"` dialog with a person search/select (call `orpc.people.list` to get people list) and role select (MEMBER/LEADER). Calls `useAddMember()` on submit.

### `apps/web/modules/saas/groups/components/AttendanceDialog.tsx`
`"use client"` dialog for recording attendance for an event. Shows list of group members with status radio buttons (PRESENT/ABSENT/LATE/EXCUSED) and notes field. Calls `orpc.attendance.record` on submit.

### `apps/web/modules/saas/groups/index.ts`
Export all components.

## Step 4 — Routes

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/groups/page.tsx`
Server component rendering `<GroupList />` with a PageHeader.

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/groups/[id]/page.tsx`
Server component that passes `params.id` to `<GroupDetail groupId={id} />`.

### `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/groups/new/page.tsx`
Renders a page with `GroupDialog` pre-opened in create mode (or just redirect to groups page after creation — your choice).

## Key Conventions
- `"use client"` only on hooks and interactive components
- Named exports only
- Use `@repo/ui/components/tabs` for the detail tabs
- Use `@repo/ui/components/badge` for role badges
- Use `useTranslations()` for all labels
- Import `orpc` from `@shared/lib/orpc-query-utils`

## Completion Criteria
- GroupList renders with skeleton state
- GroupDetail shows all tabs
- AddMemberDialog and AttendanceDialog open and submit correctly
- All routes accessible within org layout
