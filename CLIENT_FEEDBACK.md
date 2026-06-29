# Client Feedback — Testing & Feature Requests

> Source: Kelvin and Lucy, testing session on **6/13**
> Logged: 2026-06-27 · **Updated: 2026-06-28**

Legend: 🐞 Bug · ✨ Feature request · 💡 Nice-to-have

> **Status — ✅ All 17 reported bugs are fixed, merged to `main`, and deployed to production** (PRs [#10](https://github.com/zeekpardo/launchclubapp/pull/10) + [#9](https://github.com/zeekpardo/launchclubapp/pull/9); production deploy `bd09d9e0`). Feature requests & nice-to-haves below are **not started** (deferred — bug-fix scope only). We also shipped extra security/operational hardening beyond the client list — see [Additional work shipped](#additional-work-shipped).

> Jump to: [**Prioritized Roadmap**](#prioritized-roadmap) · [Detailed feedback by area](#1-organization--members--invite-members) · [Additional work shipped](#additional-work-shipped)

---

# Prioritized Roadmap

Ordered **bugs → essential features → nice-to-haves**, with bugs ranked by severity. Section references (e.g. `§6.6`) link back to the detailed notes below.

## 🔴 P0 — Critical bugs (data integrity / total blockers) — ✅ all fixed
> Fix first. These corrupt data or make a core flow unusable.

1. [x] 🐞 **Applications attributed to the wrong site** — both NTCC and GBBC links file everything under GBBC. *(§6.6)* — **✅ FIXED** — the student & mentor form layouts now submit with the selected site (`siteId={selectedSiteId || undefined}`) instead of falling back to a default, so each application files under the site whose link it came through.
2. [x] 🐞 **"No group (assign later)" applications disappear** — approved record can't be found anywhere. *(§6.5)* — **✅ FIXED** — approval now migrates the applicant into People idempotently even when "No group (assign later)" is chosen (`applications/review.ts` + idempotent `migrateApplicationToPeople`), so the person record always lands in People regardless of group choice.
3. [x] 🐞 **Invite members is broken** — inconsistent, and accepting an invite spins up a *new* organization + forces area/site/group setup instead of joining the inviter's org. *(§1)* — blocks all team onboarding. **✅ FIXED (dev + prod)** — `SignupForm.tsx` now signs an invited new user in and routes them to the invitation modal to **join the inviter's org** instead of new-org onboarding. When production requires email verification, the verification email carries the `invitationId` in its `callbackURL`, so after verifying, the user lands on the join-org flow (not new-org setup). *(An earlier approach auto-verified invited emails at signup; it was **removed during the security review** because it enabled account pre-takeover, and replaced with the callbackURL approach above.)*
4. [x] 🐞 **Site leader gets 404 on "People"** *(§2.1)* — **✅ FIXED** (People page now allows site- and group-scoped members; residual 404 was the pre-§1 invite assignment bug).
5. [x] 🐞 **Group leader can't see "People"** for their own groups *(§2.2)* — **✅ FIXED** (nav shows People to group leaders; page allows group-scoped access; verified).

## 🟠 P1 — High-impact bugs (core feature broken) — ✅ all fixed
> Feature exists but doesn't work.

6. [x] 🐞 **Can't edit anything in an application** *(§6.7)* — **✅ FIXED** (Edit dialog for parent + child core fields; new `applications.update` procedure; verified).
7. [x] 🐞 **Uploaded PDF can't be opened/viewed** *(§6.1)* — **✅ FIXED** (file fields render as signed-URL "View file" links).
8. [x] 🐞 **Group end time won't save** *(§8.1)*. **✅ VERIFIED RESOLVED** — the full chain (settings form + dialog bindings, update schema/procedure, `updateGroup` query, `getGroupById` read) correctly persists `meetingEndTime`; data round-trip confirms it saves and reads back. Already fixed in current code (no change needed).
9. [x] 🐞 **Attendance report doesn't show** after attendance is taken *(§8.6a)* — **✅ FIXED** (`getAttendanceByGroup` now matches events via the EventGroup join table instead of the always-null `event.groupId`; verified records appear).
10. [x] 🐞 **Parents not showing up in People** *(§9.1)*. **✅ RESOLVED via §6.5** — the People "parents" tab query (`getPeopleByOrganization` with `personType: PARENT`) correctly returns all parents for an admin/owner; the empty list was a downstream effect of approval never migrating applicants to people (autoMigrate gated off). With §6.5 fixed, approving an application creates the parent records and they appear. Verified the owner parents-tab query returns the created parents. (Scoped site/group leaders still only see students in their scope — guardian visibility for leaders is a separate enhancement, not this bug.)

## 🟡 P2 — Medium bugs (correctness / filtering / display) — ✅ all fixed
> Wrong or confusing data, but not blocking.

11. [x] 🐞 **Approval doesn't distinguish parent vs child** *(§6.8)* — **✅ FIXED** (approve dialog copy clarifies students are admitted, parent kept as contact; "Students to admit" heading).
12. [x] 🐞 **"Add member" lists everyone who applied** *(§8.5)* — **✅ FIXED** (person-type + site filters, default Students + group's site).
13. [x] 🐞 **"Add member" shows no role distinction** *(§8.4)* — **✅ FIXED** (each candidate shows type + current groups; already-in-group excluded).
14. [x] 🐞 **Group details missing the site** *(§8.2)* — **✅ FIXED** (site badge added to the group header).
15. [x] 🐞 **Settings: site name doesn't show up** *(§8.3)* — **✅ FIXED** (site selector falls back to the current site name).

## ✨ Essential feature requests — ⏳ not started (deferred)
> Needed to run the program well; several directly reduce the bugs above.

16. [ ] ✨ **Share-link heading showing Area / Site / Group** *(§4.1)* — directly mitigates the wrong-site confusion (P0 #1).
17. [ ] ✨ **Application review clarity:** child at top, parent labeled, show **Site** (not just group) when approving *(§6.2, §6.3, §6.4)* — pairs with P2 #11.
18. [ ] ✨ **Make each site's application form viewable** to site leader & group leader/mentor logins *(§4.2)*.
19. [ ] ✨ **Change a member's / mentor's group assignment** *(§9.3)* — ongoing operational need.
20. [ ] ✨ **Consents: capture via camera + accept images** (not just PDF) *(§5.1, §5.2)* — needed for field use.
21. [ ] ✨ **Site start date & end date** *(§7)*.
22. [ ] ✨ **Auto-create attendance Events** from a group's meeting schedule *(§8.6a-event)*.
23. [ ] ✨ **Remove the "Edit" option under Role** in group Members *(§8.7)* — prevents accidental bad edits.

## 💡 Nice-to-haves — ⏳ not started (deferred)
> Convenience / polish; schedule after the above.

24. [ ] ✨ **Form fields can select an existing member** instead of typing a name *(§4.3)* — also cuts duplicate-person data.
25. [ ] 💡 **Custom fields: sub-fields / headers / category grouping** *(§3)* — client flagged as nice-to-have.
26. [ ] ✨ **Internal notes: photo upload** *(§9.2)*.
27. [ ] ✨ **Academic record: photo upload** *(§9.4a)*.
28. [ ] ✨ **GPA auto-compute** from number / % / letter grade via equivalency table *(§9.4b)*.

---

# Detailed feedback by area

> 🐞 bugs below are checked `[x]` where fixed & deployed; ✨/💡 feature items remain `[ ]` (deferred).

## 1. Organization → Members → Invite members

- [x] 🐞 Inviting members **doesn't work consistently**.
- [x] 🐞 Clicking the invitation link created an account but flowed into the wrong place:
  - "Happy accident" — ended up **creating a new organization** instead of joining the inviter's.
  - Was forced to set up an **area, site, and group**.
  - Then taken to **login/create account**.
- [x] 🐞 Inconsistent invite results between users:
  - The invite Kelvin sent to **Lucy didn't work properly**.
  - The invite Lucy sent (with a new location) **worked well**.

**Root cause (fixed):** invitation acceptance was not attaching the new user to the existing org and was kicking off new-org onboarding; in production, email verification dropped the `invitationId`. Both addressed (see roadmap P0 #3).

---

## 2. Permissions

- [x] 🐞 A **site leader** can see the "People" page but gets a **404**.
- [x] 🐞 A **group leader** can't see the "People" button at all — they **should** be able to see the people in their own groups.

---

## 3. Custom Fields

- [ ] 💡 Allow custom fields to have **sub-fields**, a **header**, or a **category header** (grouping). *(Nice to have)*

---

## 4. Forms

- [ ] ✨ **Share links:** add a heading showing the **Area, Site, and Group** name.
- [ ] ✨ Make each site's **application form viewable** to site leader and group leader/mentor logins.
- [ ] ✨ Instead of typing a person's name, allow a form field to **select from an existing member**.

---

## 5. Consents

- [ ] ✨ Allow using the **camera to take a photo**.
- [ ] ✨ Allow **image uploads** — not just PDF.

---

## 6. Applications

- [x] 🐞 Uploaded **PDF is visible but can't be opened/viewed**.
- [ ] ✨ Put the **child at the top** of the application view.
- [ ] ✨ **Label the parent** clearly.
- [ ] ✨ When approving, **show the Site** — not just the Group.
- [x] 🐞 Approved an application with **"No group (assign later)"** — the application then **can't be found anywhere**.
- [x] 🐞 **Wrong site attribution:** two sites created (NTCC and GBBC), each with its own application link. Applications submitted through **both** links all show up under **GBBC**.
- [x] 🐞 **Can't edit anything** in an application.
- [x] 🐞 When approving, it's **not clear whether you're approving the parent or the child**. We should only be approving **children, not parents**.

---

## 7. Sites

- [ ] ✨ Add **start date** and **end date** to a Site.

---

## 8. Groups

- [x] 🐞 Group **end time won't save**.
- [x] 🐞 Group details show **group name and area but not the site**.
- [x] 🐞 Under settings, the **site name doesn't show up**.
- [x] 🐞 In "Add member," parents, children, and admins are listed with **no distinction** between them.
- [x] 🐞 "Add member" shows **everyone who applied** — the system doesn't **filter by the location** the person applied to.
- [ ] ✨ Under Members, **remove the "Edit" option** under Role.

### 8a. Attendance

- [ ] ✨ Can an **"Event" be created automatically** based on the group's meeting schedule?
- [x] 🐞 After attendance was taken, the **report is not showing up**.

---

## 9. People

- [x] 🐞 **Parents are not showing up**.
- [ ] ✨ **Internal notes:** add the ability to **upload a photo**.
- [ ] ✨ Add the ability to **change a member's and mentor's group assignment**.

### 9a. Academic Record

- [ ] ✨ Ability to **upload a photo**.
- [ ] ✨ **GPA entry:** let users type in a grade number, percentage, **or** letter grade, and have the system **automatically compute** the equivalent using the formula below.

**GPA equivalency formula:**

| Percentage | Letter Grade | 4.0 GPA |
| --- | --- | --- |
| 97–100% | A+ | 4.0 |
| 93–96% | A | 4.0 |
| 90–92% | A− | 3.5 |
| 87–89% | B+ | 3.25 |
| 83–86% | B | 3.0 |
| 80–82% | B− | 2.5 |
| 77–79% | C+ | 2.25 |
| **75–76%** | **C** | **2.0** |
| Below 75% | F | 1.0 |

---

# Additional work shipped

Beyond the client's list, the same release hardened security and operations (all merged & deployed in PRs #9/#10):

**🔒 Security hardening (11 fixes)**
- Cross-tenant authorization added to `forms.get`, `events.get`, `guardians.add/remove`, `households.get` (previously fetchable across orgs).
- IDOR fixes on `academic-records.delete`, `person-notes.update/delete`, `custom-fields.setValue/listValues`.
- Org-scoping of `createMember` / `updateMemberRole` site & group IDs, and `getMyLcRole`.
- Group-leader management permissions (`canManageGroup`) on group add/remove member.
- Event group-scope authorization on create / createSeries / update (previously only the first group was checked).
- `image-proxy` now requires a session and scopes file access to the caller's org.
- **Removed invite-email auto-verification** (security-review HIGH finding — enabled account pre-takeover).

**⚙️ Operational / product**
- **Rate limiting** on public endpoints (application submit, public form submit, contact, newsletter).
- **SaaS-only mode** enabled — marketing site disabled, `/legal` pages preserved.
- **Auth simplified** to email + password and magic link (OAuth & passkeys hidden).
- Builder **file-upload** fix (form FILE fields were storing a fake path and never uploading) + signed file-download URLs.

---

## Summary counts

| Area | Bugs | Bugs fixed | Features / Nice-to-haves |
| --- | --- | --- | --- |
| 1. Invite members | 3 | 3 ✅ | 0 |
| 2. Permissions | 2 | 2 ✅ | 0 |
| 3. Custom fields | 0 | — | 1 |
| 4. Forms | 0 | — | 3 |
| 5. Consents | 0 | — | 2 |
| 6. Applications | 5 | 5 ✅ | 3 |
| 7. Sites | 0 | — | 1 |
| 8. Groups | 6 | 6 ✅ | 2 |
| 9. People | 1 | 1 ✅ | 5 |
| **Total** | **17** | **17 ✅** | **17 ⏳ deferred** |
