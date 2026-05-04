FROM node:22.12.0-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@10.28.2 --activate

# ---- deps: install node_modules (layer cached until lockfile changes) ----
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/docs/package.json ./apps/docs/
COPY apps/mail-preview/package.json ./apps/mail-preview/
COPY apps/web/package.json ./apps/web/
COPY packages/ai/package.json ./packages/ai/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/database/package.json ./packages/database/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/logs/package.json ./packages/logs/
COPY packages/mail/package.json ./packages/mail/
COPY packages/payments/package.json ./packages/payments/
COPY packages/storage/package.json ./packages/storage/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY tooling/scripts/package.json ./tooling/scripts/
COPY tooling/tailwind/package.json ./tooling/tailwind/
COPY tooling/typescript/package.json ./tooling/typescript/
# Strip postinstall from apps we don't build — their peer deps (e.g. vite) aren't installed
RUN node -e "['apps/docs','apps/mail-preview'].forEach(d=>{const fs=require('fs'),f=d+'/package.json',p=JSON.parse(fs.readFileSync(f,'utf8'));if(p.scripts&&p.scripts.postinstall)delete p.scripts.postinstall;fs.writeFileSync(f,JSON.stringify(p))})"
RUN pnpm install --frozen-lockfile

# ---- builder: generate Prisma client and build Next.js ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run from workspace root so Prisma doesn't pick up packages/database/prisma.config.ts (which imports dotenv).
# Use the installed binary instead of npx to avoid downloading a different version.
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" NODE_OPTIONS='--experimental-require-module' \
    node_modules/.bin/prisma generate --schema=packages/database/prisma/schema.prisma --no-hints

RUN node -e "\
const fs=require('fs');\
const f='packages/database/prisma/zod/index.ts';\
let c=fs.readFileSync(f,'utf8');\
if(!c.includes(\"import { Prisma }\")){c=c.replace(\"import * as z from 'zod';\",\"import * as z from 'zod';\\nimport { Prisma } from '../generated/client';\");fs.writeFileSync(f,c);console.log('Patched zod/index.ts');} else {console.log('zod/index.ts already patched');}\
"

ARG NEXT_PUBLIC_SITE_URL
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    RESEND_API_KEY="re_dummy" \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    pnpm --filter web build

# ---- runner: minimal image with standalone output ----
FROM node:22.12.0-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Prisma CLI for db push at startup
RUN npm install -g prisma@7.1.0

# Standalone server + trimmed node_modules
COPY --from=builder /app/apps/web/.next/standalone ./
# Static assets (not included in standalone automatically)
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
# Prisma schema for db push
COPY --from=builder /app/packages/database/prisma/schema.prisma ./packages/database/prisma/schema.prisma

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "apps/web/server.js"]
