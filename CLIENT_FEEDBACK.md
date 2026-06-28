# Client Feedback — Testing & Feature Requests

> Source: Kelvin and Lucy, testing session on **6/13**
> Logged: 2026-06-27

Legend: 🐞 Bug · ✨ Feature request · 💡 Nice-to-have

> Jump to: [**Prioritized Roadmap**](#prioritized-roadmap) · [Detailed feedback by area](#1-organization--members--invite-members)

---

# Prioritized Roadmap

Ordered **bugs → essential features → nice-to-haves**, with bugs ranked by severity. Section references (e.g. `§6.6`) link back to the detailed notes below.

## 🔴 P0 — Critical bugs (data integrity / total blockers)
> Fix first. These corrupt data or make a core flow unusable.

1. [ ] 🐞 **Applications attributed to the wrong site** — both NTCC and GBBC links file everything under GBBC. *(§6.6)* — corrupts which site a child belongs to.
2. [ ] 🐞 **"No group (assign later)" applications disappear** — approved record can't be found anywhere. *(§6.5)* — effective data loss.
3. [x] 🐞 **Invite members is broken** — inconsistent, and accepting an invite spins up a *new* organization + forces area/site/group setup instead of joining the inviter's org. *(§1)* — blocks all team onboarding. **✅ FIXED (dev + prod)** — two changes: (a) `SignupForm.tsx` now signs invited new users in and routes them to the invitation modal to join the existing org; (b) `auth.ts` `databaseHooks.user.create.before` marks an invited user's email verified at signup, so production's `requireEmailVerification` no longer forces a verification round-trip that dropped the `invitationId` and pushed them into creating a new org. Verified end-to-end (membership = existing org, `emailVerified: true`, invitation `accepted`).
4. [ ] 🐞 **Site leader gets 404 on "People"** *(§2.1)* — blocks a core role.
5. [ ] 🐞 **Group leader can't see "People"** for their own groups *(§2.2)* — blocks a core role.

## 🟠 P1 — High-impact bugs (core feature broken)
> Feature exists but doesn't work.

6. [ ] 🐞 **Can't edit anything in an application** *(§6.7)*.
7. [ ] 🐞 **Uploaded PDF can't be opened/viewed** *(§6.1)*.
8. [x] 🐞 **Group end time won't save** *(§8.1)*. **✅ VERIFIED RESOLVED** — the full chain (settings form + dialog bindings, update schema/procedure, `updateGroup` query, `getGroupById` read) correctly persists `meetingEndTime`; data round-trip confirms it saves and reads back. Already fixed in current code (no change needed).
9. [ ] 🐞 **Attendance report doesn't show** after attendance is taken *(§8.6a)*.
10. [x] 🐞 **Parents not showing up in People** *(§9.1)*. **✅ RESOLVED via §6.5** — the People "parents" tab query (`getPeopleByOrganization` with `personType: PARENT`) correctly returns all parents for an admin/owner; the empty list was a downstream effect of approval never migrating applicants to people (autoMigrate gated off). With §6.5 fixed, approving an application creates the parent records and they appear. Verified the owner parents-tab query returns the created parents. (Scoped site/group leaders still only see students in their scope — guardian visibility for leaders is a separate enhancement, not this bug.)

## 🟡 P2 — Medium bugs (correctness / filtering / display)
> Wrong or confusing data, but not blocking.

11. [ ] 🐞 **Approval doesn't distinguish parent vs child** — should only approve *children*, not parents *(§6.8)*.
12. [ ] 🐞 **"Add member" lists everyone who applied** — no filtering by the location they applied to *(§8.5)*.
13. [ ] 🐞 **"Add member" shows no role distinction** between parents, children, admins *(§8.4)*.
14. [ ] 🐞 **Group details missing the site** (shows name + area only) *(§8.2)*.
15. [ ] 🐞 **Settings: site name doesn't show up** *(§8.3)*.

## ✨ Essential feature requests
> Needed to run the program well; several directly reduce the bugs above.

16. [ ] ✨ **Share-link heading showing Area / Site / Group** *(§4.1)* — directly mitigates the wrong-site confusion (P0 #1).
17. [ ] ✨ **Application review clarity:** child at top, parent labeled, show **Site** (not just group) when approving *(§6.2, §6.3, §6.4)* — pairs with P2 #11.
18. [ ] ✨ **Make each site's application form viewable** to site leader & group leader/mentor logins *(§4.2)*.
19. [ ] ✨ **Change a member's / mentor's group assignment** *(§9.3)* — ongoing operational need.
20. [ ] ✨ **Consents: capture via camera + accept images** (not just PDF) *(§5.1, §5.2)* — needed for field use.
21. [ ] ✨ **Site start date & end date** *(§7)*.
22. [ ] ✨ **Auto-create attendance Events** from a group's meeting schedule *(§8.6a-event)*.
23. [ ] ✨ **Remove the "Edit" option under Role** in group Members *(§8.7)* — prevents accidental bad edits.

## 💡 Nice-to-haves
> Convenience / polish; schedule after the above.

24. [ ] ✨ **Form fields can select an existing member** instead of typing a name *(§4.3)* — also cuts duplicate-person data.
25. [ ] 💡 **Custom fields: sub-fields / headers / category grouping** *(§3)* — client flagged as nice-to-have.
26. [ ] ✨ **Internal notes: photo upload** *(§9.2)*.
27. [ ] ✨ **Academic record: photo upload** *(§9.4a)*.
28. [ ] ✨ **GPA auto-compute** from number / % / letter grade via equivalency table *(§9.4b)*.

---

# Detailed feedback by area

## 1. Organization → Members → Invite members

- [ ] 🐞 Inviting members **doesn't work consistently**.
- [ ] 🐞 Clicking the invitation link created an account but flowed into the wrong place:
  - "Happy accident" — ended up **creating a new organization** instead of joining the inviter's.
  - Was forced to set up an **area, site, and group**.
  - Then taken to **login/create account**.
- [ ] 🐞 Inconsistent invite results between users:
  - The invite Kelvin sent to **Lucy didn't work properly**.
  - The invite Lucy sent (with a new location) **worked well**.

**Likely root cause to investigate:** invitation acceptance is not attaching the new user to the existing org; instead it kicks off the new-org onboarding flow.

---

## 2. Permissions

- [ ] 🐞 A **site leader** can see the "People" page but gets a **404**.
- [ ] 🐞 A **group leader** can't see the "People" button at all — they **should** be able to see the people in their own groups.

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

- [ ] 🐞 Uploaded **PDF is visible but can't be opened/viewed**.
- [ ] ✨ Put the **child at the top** of the application view.
- [ ] ✨ **Label the parent** clearly.
- [ ] ✨ When approving, **show the Site** — not just the Group.
- [ ] 🐞 Approved an application with **"No group (assign later)"** — the application then **can't be found anywhere**.
- [ ] 🐞 **Wrong site attribution:** two sites created (NTCC and GBBC), each with its own application link. Applications submitted through **both** links all show up under **GBBC**.
- [ ] 🐞 **Can't edit anything** in an application.
- [ ] 🐞 When approving, it's **not clear whether you're approving the parent or the child**. We should only be approving **children, not parents**.

---

## 7. Sites

- [ ] ✨ Add **start date** and **end date** to a Site.

---

## 8. Groups

- [ ] 🐞 Group **end time won't save**.
- [ ] 🐞 Group details show **group name and area but not the site**.
- [ ] 🐞 Under settings, the **site name doesn't show up**.
- [ ] 🐞 In "Add member," parents, children, and admins are listed with **no distinction** between them.
- [ ] 🐞 "Add member" shows **everyone who applied** — the system doesn't **filter by the location** the person applied to.
- [ ] ✨ Under Members, **remove the "Edit" option** under Role.

### 8a. Attendance

- [ ] ✨ Can an **"Event" be created automatically** based on the group's meeting schedule?
- [ ] 🐞 After attendance was taken, the **report is not showing up**.

---

## 9. People

- [ ] 🐞 **Parents are not showing up**.
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

## Summary counts

| Area | Bugs | Features / Nice-to-haves |
| --- | --- | --- |
| 1. Invite members | 3 | 0 |
| 2. Permissions | 2 | 0 |
| 3. Custom fields | 0 | 1 |
| 4. Forms | 0 | 3 |
| 5. Consents | 0 | 2 |
| 6. Applications | 5 | 3 |
| 7. Sites | 0 | 1 |
| 8. Groups | 6 | 2 |
| 9. People | 1 | 5 |
| **Total** | **17** | **17** |
