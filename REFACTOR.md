# Refactoring Tracker

## Guiding Principles

1. **Bottom-up** — fix shared primitives (schemas, utilities) before the components that consume them
2. **Low-risk first** — pure utilities and type-only changes before component/hook logic
3. **Batch by layer** — one PR per layer keeps reviews focused and diffs coherent

---

## Phase 1 — Shared Utilities

Pure functions, no side effects. Nothing can break.

| # | Fix | File to create | Status |
|---|-----|----------------|--------|
| 8 | Unify three `slugify` implementations | `modules/saas/shared/lib/slugify.ts` | [ ] |
| 5 | Extract field value mapping utility | `modules/saas/shared/lib/field-value-utils.ts` | [ ] |

**Sources:**
- `slugify` defined 3x: `FieldCard.tsx`, `AreaFormBuilder.tsx` (use `_`), `SiteDialog.tsx` (uses `-`)
- Field value map: `ApplicationForm.tsx` and `ChildCard.tsx` both do `.map(f => ({ ...key, value: map[f.id] ?? "" })).filter(v => v.value !== "")`

---

## Phase 2 — API / Backend Type Consolidation

Do before touching components so Phase 3 consumers get clean shared types. TypeScript will flag every broken consumer.

| # | Fix | File to create/update | Status |
|---|-----|-----------------------|--------|
| 1 | Shared `addressSchema` | `packages/api/modules/shared/schemas.ts` | [ ] |
| 3 | Remove duplicate field type enums | Use Prisma-generated enums; delete hand-written zod re-declarations | [ ] |
| 9 | Shared `childSchema` | Export from `applications/types.ts`, import on frontend | [ ] |
| 10 | `SiteFormValues` in one place | Create `modules/saas/sites/types.ts`, import in dialog + form fields | [ ] |

**Sources:**
- `addressSchema` duplicated in: `sites/types.ts`, `households/types.ts`, `applications/types.ts`
- Field type enums re-declared in: `custom-fields/types.ts`, `form-builder/types.ts`, `prisma/zod/index.ts`
- `childSchema` defined in both `ApplicationForm.tsx` (frontend) and `applications/types.ts` (backend)
- `SiteFormValues` interface redefined in both `SiteDialog.tsx` and `SiteFormFields.tsx`

---

## Phase 3 — Component Extraction

Extract repeated UI patterns. Same rendered output, just reorganized.

| # | Fix | Component to create | Status |
|---|-----|---------------------|--------|
| 4 | `<FormFieldRenderer>` | `form-builder/components/FormFieldRenderer.tsx` | [ ] |
| 6 | `<AddressFormFields>` | `shared/components/AddressFormFields.tsx` | [ ] |

**Sources:**
- `FormFieldRenderer`: `TEXTAREA / SELECT / CHECKBOX / DATE / NUMBER / Input` branching duplicated twice in `ChildCard.tsx` (~lines 314-363 and 391-434)
- `AddressFormFields`: 2-column address grid layout duplicated in `SiteFormFields.tsx` and `ApplicationForm.tsx`

---

## Phase 4 — Hook Patterns

Leave last — touches the most files and has the subtlest behavior (cache invalidation).

| # | Fix | Notes | Status |
|---|-----|-------|--------|
| 7 | Standardize query invalidation strategy | Pick one style (`queryOptions` vs `slice`) across all hooks | [ ] |
| 2 | CRUD hook factory | Create factory, then migrate `use-custom-fields`, `use-sites`, `use-areas` one at a time | [ ] |

**Sources:**
- Invalidation style inconsistency: `sites` uses `queryKey.slice(0, 1)`, `custom-fields` uses full `queryOptions`, `areas`/`groups` mixed
- CRUD pattern repeated identically in: `use-custom-fields.ts`, `use-sites.ts`, `use-areas.ts`

---

## Deferred

| # | Fix | Reason |
|---|-----|--------|
| 11 | Generic reorder procedure factory | Only 2 instances (custom fields, form builder) — add when a third appears |
| 12 | Prisma include pattern for field values | Document as convention rather than abstract now |

---

## Estimated Effort

| Phase | Est. Time |
|-------|-----------|
| Phase 1 | ~30 min |
| Phase 2 | ~1 hour |
| Phase 3 | ~1–2 hours |
| Phase 4 | ~1–2 hours |
