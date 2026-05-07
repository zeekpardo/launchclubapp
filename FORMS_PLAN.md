# Forms Redesign + Person Types — Project Plan

> Track implementation progress here. Check off tasks as they complete.
> Last updated: 2026-05-07

---

## Overview

Two foundational changes shipped together because forms depend on the person model:

1. **Person Types** — Replace `isChild: Boolean` with `personType: STUDENT | PARENT | MENTOR` enum
2. **Forms Architecture** — Move forms to top-level nav, support multiple named forms per org, assign forms to sites, unified form builder

---

## Key Risks

- [ ] `personType` migration: `isChild: false` records must be bucketed correctly into PARENT vs MENTOR. Run a dry-run count before migrating.
- [ ] `targetPersonType` on FormField: must be enforced at insert time — wrong assignment silently routes submission values to the wrong person record.
- [ ] `FormSite` + SITE_SELECTOR auto-injection: adding/removing sites must be transactional with field injection/removal.

---

## Phase 1 — Schema + Migrations `lc-schema` ✅ COMPLETE

### Person Model
- [x] Add `PersonType` enum: `STUDENT | PARENT | MENTOR`
- [x] Replace `isChild: Boolean` with `personType: PersonType` on Person model
- [x] Write migration: bucket existing records
  - `isChild: true` → `STUDENT` (migration default: `STUDENT`)
  - New records explicitly set `PARENT` or `STUDENT` on creation
  - Note: MENTOR bucket logic deferred to mentor approval flow (Phase 2)

### Form Model (new)
- [x] Add `Form` model (id, slug, name, description, type, status, organizationId, timestamps, deletedAt)
- [x] Add `FormSite` junction table (formId, siteId, composite PK)
- [x] Add `FormFieldType` enum values: `PROFILE`, `CUSTOM`, `SITE_SELECTOR`

### FormField Model (updated)
- [x] Add `formId` FK → Form
- [x] Add `profileFieldKey: String?`
- [x] Add `customFieldId` FK → CustomField (nullable)
- [x] Add `targetPersonType: PersonType?`
- [x] Drop `areaId`, `siteId`, `organizationId` from FormField
- [x] Add unique index: `Form.slug` scoped to `organizationId`

### DB Queries
- [x] Update `getPeopleByOrganization()` — `isChild` filter → `personType` filter
- [x] Update `createPerson()` — `isChild` → `personType` (via `createPersonSchema`)
- [x] Update `updatePerson()` — same
- [x] Write `createForm()` query
- [x] Write `getFormBySlug()` query
- [x] Write `getFormsByOrganization()` query
- [x] Write `updateForm()` query
- [x] Write `softDeleteForm()` query
- [x] Write `getFormFields(formId)` query — replaces listAreaFields / listOrgFields
- [x] Write `assignSitesToForm()` query — manages FormSite junction
- [x] Write `getFormSites(formId)` query
- [x] Write `getFormFieldsForSite(siteId)` query — for application submit validation
- [x] Write `getFormFieldsBySiteSlug(siteSlug)` query — for public apply page

### Migration Applied
- [x] Migration `20260507024645_phase1_person_type_and_forms` applied to `supastarter_dev`
- [x] Prisma client + Zod schemas regenerated
- [x] Full workspace type-check: 13/13 ✅

---

## Phase 2 — People API `lc-api-people` ✅ COMPLETE (bundled with Phase 1)

- [x] Update `createPersonSchema` — `isChild: z.boolean()` → `personType: z.enum([...])`
- [x] Update `listPeopleSchema` — `isChild?: z.boolean()` → `personType?: z.enum([...])`
- [x] Update `createPersonProcedure` — studentId auto-gen guard: `personType === "STUDENT"`
- [x] Update `listPeople` procedure — pass `personType` filter through
- [ ] Update `addGuardianProcedure` — validate `personId` is PARENT, `kidId` is STUDENT
- [x] Update academic records guard — `person.isChild !== true` → `person.personType !== "STUDENT"`
- [x] Update `migrateApplicationToPeople()` — creates PARENT + STUDENT records
- [ ] Update mentor application approval — creates `MENTOR` person on approve

---

## Phase 3 — Forms API `lc-api-applications`

### Forms Router (new)
- [ ] `forms.create` — creates Form + auto-generates slug, validates type + sites required
- [ ] `forms.list` — lists org forms with site count, status
- [ ] `forms.get` — get single form with fields + sites
- [ ] `forms.update` — name, description, status (type immutable)
- [ ] `forms.softDelete` — sets deletedAt
- [ ] `forms.assignSites` — updates FormSite junction, auto-manages SITE_SELECTOR field

### Form Builder Router (refactored)
- [ ] Refactor `addField` — accepts `formId` instead of `areaId | siteId | organizationId`
- [ ] Refactor `updateField` — same
- [ ] Refactor `deleteField` — same
- [ ] Refactor `reorderFields` — same
- [ ] Rename `listAreaFields` / `listOrgFields` → `listFields(formId)`
- [ ] Add SITE_SELECTOR auto-injection logic in `assignSites` — inject when site count ≥ 2, remove at count = 1
- [ ] Remove `AreaFormBuilder` and `OrgFormBuilder` procedures (migrate to single `formId` pattern)

### Public Form API
- [ ] `publicForm.getBySlug(orgSlug, formSlug)` — returns form + fields if PUBLISHED
- [ ] `publicForm.submit` — validates fields, creates Application or MentorApplication, triggers household merge

---

## Phase 4 — People UI `lc-ui-people`

- [ ] Update `PeopleTable` — tabs: All / Parents / Students / Mentors (replace Adults / Kids)
- [ ] Update `PersonForm` — replace `isChild` toggle with `personType` selector (STUDENT | PARENT | MENTOR)
- [ ] Update conditional fields — show grade/studentId/allergies/medicalNotes for `STUDENT` only
- [ ] Update `HouseholdPanel` — replace `isChild ? "Child" : "Adult"` with personType label
- [ ] Update `GuardianManager` — query `personType: PARENT` instead of `isChild: false`
- [ ] Update `AcademicRecordsSection` — check `personType === STUDENT`

---

## Phase 5 — Forms List + Nav `lc-ui-applications`

- [ ] Add Forms entry to `NavBar` (main left nav, alongside Groups / People / Events)
- [ ] Create `FormsListPage` (`/app/{orgSlug}/forms`)
  - PageHeader + SettingsMenu pattern
  - FormCard: name, STUDENT|MENTOR badge, PUBLISHED|UNPUBLISHED badge, site count
  - "+ New Form" button
- [ ] Create `CreateFormModal`
  - Fields in order: Name (required), Type — STUDENT|MENTOR radio (required), Sites — multi-select (required)
  - On submit: creates form, navigates to builder

---

## Phase 6 — Form Builder `lc-ui-applications`

### Layout
- [ ] Create `FormBuilderPage` (`/app/{orgSlug}/forms/{formId}`)
  - Top nav tabs: **Builder** | **Settings** (SettingsMenu pattern)
- [ ] Builder tab: left canvas (scrollable) + right FieldTypePicker (always visible, fixed)
- [ ] Settings tab: name, description, sites assignment, publish/unpublish, delete

### Canvas
- [ ] Refactor `FormBuilderCanvas` — accepts `formId`, single unified canvas
- [ ] Editable form name + description inline (top of canvas)
- [ ] All field types (Profile, Custom, Basic, Workflow) drag-reorderable in one canvas
- [ ] STUDENT forms: seed locked Parent Information section + locked Student Information section
- [ ] Student section: repeatable (+ Add student button)
- [ ] Site info banner when single site assigned: "Assigned to {site name}"
- [ ] SITE_SELECTOR field auto-appears at top when 2+ sites assigned
- [ ] Unsaved changes warning on navigate-away (warn before leaving with open edits)

### FieldTypePicker (rewrite)
- [ ] Three sections: Profile Fields / Workflow Fields / Basic Fields
- [ ] Profile Fields section filtered by context (parent section vs student section vs mentor form)
  - Parent profile fields: phone, address, emergency contact, notes, marital status, anniversary — NO grade/school
  - Student profile fields: birthdate, grade, school, medical note, allergies — full set
  - Custom field option: dropdown to select which org custom field
- [ ] Workflow Fields: single checkbox, checkboxes, dropdown
- [ ] Basic Fields: text, paragraph, single checkbox, checkboxes, dropdown, date, file, section heading, number
- [ ] Fields already on canvas hidden from picker
- [ ] Consent fields available as insertable fields (STUDENT forms only)

### Cleanup
- [ ] Delete `AreaFormBuilder` component
- [ ] Delete `OrgFormBuilder` component
- [ ] Remove form builder from settings/areas and settings/mentor pages

---

## Phase 7 — Public Form Route `lc-ui-applications`

- [ ] New route: `/app/apply/[orgSlug]/[formSlug]/page.tsx` (replaces `/apply/[siteSlug]`)
- [ ] Fetch form by `orgSlug` + `formSlug`
- [ ] If UNPUBLISHED: show error page — "This form isn't available. Please reach out to {org name} staff."
- [ ] If PUBLISHED STUDENT form:
  - Parent section (fields with `targetPersonType: PARENT`)
  - Repeatable student section (fields with `targetPersonType: STUDENT`) with "+ Add student"
  - SITE_SELECTOR at top if multi-site form
- [ ] If PUBLISHED MENTOR form:
  - Single flat form
- [ ] Submission handler: validate required fields, create Application or MentorApplication

---

## Phase 8 — Submission Processing `lc-api-applications`

- [ ] STUDENT form submission → `createApplication()` + `migrateApplicationToPeople()` flow
  - Match parent by email → merge/update PARENT record if exists
  - Match student by name+DOB under household → merge/update STUDENT record if exists
  - Otherwise create new PARENT + STUDENT records + household
  - Create Guardian links PARENT → STUDENT
- [ ] MENTOR form submission → `createMentorApplication()` flow
  - On approve: create MENTOR person record
- [ ] Field value routing: `targetPersonType` determines which record stores the value

---

## Phase 9 — Edge Case Polish

- [ ] Deleted CustomField: FormField shows "[Deleted field]" label in builder
- [ ] SITE_SELECTOR transactional: add/remove is atomic with site count change
- [ ] `personType` guard on Guardian: reject if personId not PARENT or kidId not STUDENT
- [ ] Form type immutability: block `type` updates after creation in API
- [ ] Soft-deleted form: hide from builder list, public URL returns 404/error page
- [ ] Past submissions retain `formId` link when site reassigned to new form

---

## Data Model Reference

### PersonType enum
```
STUDENT  — child participant (has grade, studentId, allergies, medicalNotes)
PARENT   — guardian of students (linked via Guardian model)
MENTOR   — group leader / staff
```

### Form
```
id             cuid
slug           string  (nanoid 8-char, unique per org) → /apply/{orgSlug}/{slug}
name           string
description    string?
type           STUDENT | MENTOR  (immutable)
status         PUBLISHED | UNPUBLISHED
organizationId FK → Organization
deletedAt      DateTime?  (soft delete)
```

### FormField (updated)
```
formId           FK → Form
type             TEXT | TEXTAREA | NUMBER | DATE | SELECT | CHECKBOX | RADIO | FILE | HEADER | PROFILE | CUSTOM | SITE_SELECTOR
profileFieldKey  string?  ("phone", "birthdate", "grade", ...)
customFieldId    FK → CustomField?
targetPersonType PARENT | STUDENT | null
label            string
required         boolean
order            int
options          Json?
validation       Json?
```

### FormSite (junction)
```
formId   FK → Form
siteId   FK → Site
PK: (formId, siteId)
```

---

## Public URL Pattern
```
/apply/{orgSlug}/{formSlug}
```
Form slug is auto-generated (nanoid 8-char) on creation. Never derived from name. Stable forever.

---

## Profile Fields by Person Type

| Field | Parent | Student | Mentor |
|---|---|---|---|
| Phone | ✓ | | ✓ |
| Address | ✓ | | ✓ |
| Emergency contact | ✓ | | |
| Notes | ✓ | ✓ | ✓ |
| Marital status | ✓ | | |
| Anniversary date | ✓ | | |
| Birthdate | | ✓ | ✓ |
| Grade | | ✓ | |
| School | | ✓ | |
| Medical note | | ✓ | |
| Allergies | | ✓ | |
| Student ID | | ✓ | |

---

## Notes & Decisions

- `PersonType` replaces `isChild` — PersonGroup roles (member/leader) stay unchanged
- Form `type` is immutable after creation
- `SITE_SELECTOR` field is system-managed, not user-created
- Parent who also mentors → personType `MENTOR`; guardian relationship handles parent connection
- All form builders collapse into one `FormBuilder` component keyed on `formId`
- Settings page UI pattern (`SettingsMenu` + `PageHeader`) used throughout forms section
- Soft delete only on forms — no hard deletes
