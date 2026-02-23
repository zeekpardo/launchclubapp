FROM node:22.12.0-bookworm-slim

# Required for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Setup pnpm via corepack
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client (gitignored, must be built)
RUN cd packages/database && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" NODE_OPTIONS='--experimental-require-module' npx prisma generate --no-hints

# Patch zod/index.ts — prisma generate regenerates it without the Prisma import;
# this replicates the post-patch from the local generate script
RUN node -e "\
const fs=require('fs');\
const f='packages/database/prisma/zod/index.ts';\
let c=fs.readFileSync(f,'utf8');\
if(!c.includes(\"import { Prisma }\")){\
  c=c.replace(\"import * as z from 'zod';\",\"import * as z from 'zod';\\nimport { Prisma } from '../generated/client';\");\
  fs.writeFileSync(f,c);\
  console.log('Patched zod/index.ts with Prisma import');\
} else { console.log('zod/index.ts already has Prisma import'); }\
"

# Build the web app
ARG NEXT_PUBLIC_SITE_URL
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    RESEND_API_KEY="re_dummy" \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    pnpm --filter web build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["pnpm", "--filter", "web", "start"]
