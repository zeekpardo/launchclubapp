# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22.12.0-bookworm-slim AS builder

RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile

# Generate Prisma client (gitignored, must be produced at build time)
RUN cd packages/database && \
    DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    NODE_OPTIONS='--experimental-require-module' \
    npx prisma generate --no-hints

# Fix zod/index.ts — prisma generate drops the Prisma import; restore it
RUN node -e "\
const fs=require('fs');\
const f='packages/database/prisma/zod/index.ts';\
let c=fs.readFileSync(f,'utf8');\
if(!c.includes(\"import { Prisma }\")){\
  c=c.replace(\"import * as z from 'zod';\",\"import * as z from 'zod';\\nimport { Prisma } from '../generated/client';\");\
  fs.writeFileSync(f,c);\
  console.log('Patched zod/index.ts');\
} else { console.log('zod/index.ts already patched'); }\
"

ARG NEXT_PUBLIC_SITE_URL
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    RESEND_API_KEY="re_dummy" \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    pnpm --filter web build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:22.12.0-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output contains server.js + minimal traced node_modules
COPY --from=builder /app/apps/web/.next/standalone ./

# Static assets and public dir must be alongside server.js
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public        ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
