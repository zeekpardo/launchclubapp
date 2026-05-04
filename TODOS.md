# LaunchClub — Open TODOs

Sourced from Kelvin/PCL review session (2026-05-01).

---

## Quick Fixes — Language & UI

- [ ] Rename "Purchase Request" → "Ministry Request" _(pending Kelvin workflow clarification — see below)_
- [x] Rename role label "Leader" → "Mentor" throughout the app
- [x] Rename "Start" page → "Dashboard"
- [x] Fix edit pencil icon on events inside the Groups module — currently does nothing; should open the same edit modal that works in the Events module

---

## Application Form

- [ ] Wire custom profile fields through to the public `/apply/[siteSlug]` form — fields are being created in org settings but not appearing on the public form
- [ ] Build admin UI to edit the application form per-site (Area → Site → Form Fields — the route exists, custom fields just aren't surfacing yet)
- [ ] Either build the parent confirmation email for application submission, or turn off the "email notifications to parents" toggle in org settings — no email is currently being sent

---

## People / Profiles

- [ ] Add Active / Inactive status to person profiles
- [ ] On the People list view, show only Active people by default with a toggle to include Inactive
- [ ] Fix "Show Removed Members" in group attendance — historical attendance for removed members is not populating

---

## Attendance

- [ ] Add custom date range option to the attendance filter dropdown _(currently: All Time, 6 months, 30 days)_
- [x] Wire up click on attendance badge in the Events page to open attendance dialog — the attendance component already exists, just needs to be linked

---

## Dashboard _(post-launch, revisit with real data)_

- [ ] Break "Total Members" count into Kids vs. Mentors separately
- [ ] Defer all other dashboard widget decisions until real data is loaded

---

## Needs Kelvin Clarification Before Building

- [ ] **Ministry Request workflow** — are leaders submitting requests _before_ purchasing (approval flow), or uploading receipts _after_ (reimbursement)? Determines whether receipt upload is needed.
- [ ] **Site-level document uploads** — church name, pastor name, file uploads on site profiles. Confirm use case before building.

---

## Resolved / No Longer Needed

- ~~Purchase request date filter bug~~ — was a filter state issue, confirmed working
- ~~Application status page~~ — already exists (pending status shown)
- ~~Many "blue" Notion list items~~ — now coverable via custom fields; go through and mark those fulfilled
