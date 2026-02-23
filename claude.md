# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start all apps (web + docs + mail-preview)
pnpm build            # Build all packages via Turbo
pnpm lint             # Biome linting
pnpm check            # Biome check with auto-fix
pnpm format           # Biome formatting
pnpm type-check       # TypeScript check across workspace

# Run a single app
pnpm --filter web dev
pnpm --filter docs dev

# Database (packages/database)
pnpm --filter database migrate    # Run Prisma migrations (dev)
pnpm --filter database generate   # Regenerate Prisma client
pnpm --filter database push       # Push schema without migration
pnpm --filter database studio     # Open Prisma Studio

# Auth schema
pnpm --filter auth migrate        # Regenerate Better Auth schema

# E2E tests
pnpm --filter web e2e             # Playwright with UI
pnpm --filter web e2e:ci          # CI mode (installs browsers first)

# Local infrastructure (PostgreSQL + MinIO)
docker compose up -d
```

## Architecture

This is a **pnpm + Turbo monorepo** for a production SaaS starter kit.

```
apps/
  web/          # Main Next.js 16 app (App Router)
  docs/         # Documentation site
  mail-preview/ # Email template preview tool
packages/
  api/          # oRPC type-safe RPC layer + Hono HTTP handler
  auth/         # Better Auth config (passkeys, magic links, OAuth, 2FA, orgs)
  database/     # Prisma ORM + PostgreSQL schema
  i18n/         # next-intl translations and locale config
  mail/         # Email templates (React Email) + provider adapters
  payments/     # Stripe, LemonSqueezy, Polar, Creem, DodoPayments
  storage/      # S3-compatible file storage (local: MinIO)
  ui/           # Shadcn UI components (@repo/ui)
  ai/           # Vercel AI SDK + OpenAI/Anthropic integrations
  utils/        # Shared utilities
tooling/
  typescript/   # Shared tsconfig (@repo/tsconfig)
  tailwind/     # Shared Tailwind config + theme.css (@repo/tailwind-config)
```

### apps/web structure

```
app/
  (marketing)/[locale]/   # Public pages with locale routing
  (saas)/                 # Protected app (requires session)
    app/                  # Main dashboard
    choose-plan/          # Payment/subscription flow
    onboarding/
  auth/                   # Login, signup, verify (no locale prefix)
  api/[[...rest]]/        # oRPC catch-all handler
modules/
  marketing/              # Marketing page components
  saas/                   # SaaS feature modules (orgs, settings, payments, AI)
  shared/                 # Auth components, layouts, hooks
  i18n/                   # next-intl setup, routing, locale cookie
content/                  # MDX content (blog, legal, docs) via Content Collections
tests/                    # Playwright E2E tests
```

### Key path aliases

| Alias | Resolves to |
|---|---|
| `@repo/*` | `packages/*` |
| `@shared/*` | `apps/web/modules/shared/*` |
| `@saas/*` | `apps/web/modules/saas/*` |
| `@marketing/*` | `apps/web/modules/marketing/*` |

### API layer (oRPC)

Procedures live in `packages/api/modules/[feature]/procedures/`. Three middleware levels:
- `publicProcedure` — unauthenticated
- `protectedProcedure` — requires session
- `adminProcedure` — requires admin role

Client-side querying uses TanStack Query via `orpc` utilities from `@shared/lib/orpc-query-utils`.

### Authentication

Better Auth is configured in `packages/auth`. The database schema is auto-generated — run `pnpm --filter auth migrate` after changing auth config. Multi-tenancy is built in via organizations.

- Server: `import { getSession } from "@saas/auth/lib/server"`
- Client: `import { useSession } from "@saas/auth/hooks/use-session"`
- Org context: `import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization"`

### i18n

Marketing pages use `[locale]` URL segments. SaaS app routes are not locale-prefixed. Server components must call `setRequestLocale(locale)`. Locale is also persisted in a `NEXT_LOCALE` cookie.

### Database

Prisma + PostgreSQL. Never instantiate Prisma directly in app code — import from `@repo/database`. Queries belong in `packages/database/prisma/queries/`. Local dev uses Docker Compose (postgres on port 5432, credentials: postgres/postgres).

### Payments

Multiple providers supported; Stripe is primary. All payment logic is in `packages/payments`. Subscription model supports `SUBSCRIPTION` and `ONE_TIME` purchase types at both user and organization level.

### Environment setup

Copy `.env.local.example` to `.env.local` in `apps/web`. Key groups:
- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL
- `BETTER_AUTH_SECRET` + OAuth keys
- Payment provider keys (`STRIPE_SECRET_KEY`, etc.)
- `NEXT_PUBLIC_PRICE_ID_*` — Price IDs per plan/interval
- S3 credentials (or use local MinIO)
- Email provider key (Resend recommended)

### Coding conventions

Full coding guidelines are in `agents.md`. Key points:
- Default to React Server Components; add `"use client"` only when needed
- Interfaces over type aliases; no enums (use `as const` maps)
- Named function exports; no default exports
- Forms: react-hook-form + zod; API input schemas defined in `packages/api/modules/[feature]/types.ts`
- Config imported from `@/config` (app) or `@repo/[package]/config` (packages)
