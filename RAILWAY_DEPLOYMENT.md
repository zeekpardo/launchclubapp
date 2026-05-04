# Railway Deployment Guide

This guide covers deploying the supastarter-nextjs monorepo to Railway from scratch.

---

## Overview

The stack requires three Railway services:

| Service | Image / Source | Notes |
|---------|---------------|-------|
| **web** | Dockerfile (this repo) | Main Next.js app |
| **postgres** | `postgres:16-alpine` | Managed by Railway or custom |
| **minio** | `minio/minio:latest` | S3-compatible object storage |

---

## 1. Create a Railway Project

1. Go to [railway.app](https://railway.app) and create a new project
2. Link the GitHub repo to the project (used for the `web` service)

---

## 2. Add PostgreSQL

Add a PostgreSQL database service to the project. Railway offers a managed Postgres plugin or you can deploy the image manually.

Once created, copy the `DATABASE_URL` connection string — you'll need it for the web service.

---

## 3. Add MinIO

Deploy a MinIO service using the `minio/minio:latest` image and set these environment variables:

```
MINIO_ROOT_USER=<your-access-key>
MINIO_ROOT_PASSWORD=<your-secret-key>
MINIO_SERVER_URL=https://<your-minio-railway-domain>
MINIO_API_CORS_ALLOW_ORIGIN=https://<your-app-domain>,http://localhost:3000
PORT=9000
```

After MinIO is running, **create the required buckets** via the MinIO console or `mc` CLI:

```bash
mc alias set prod https://<your-minio-domain> <access-key> <secret-key>
mc mb prod/avatars
mc mb prod/custom-fields
mc anonymous set download prod/avatars
```

---

## 4. Configure the Web Service

### 4.1 Source

Point the web service at this repository. Railway will use the `railway.json` and `Dockerfile` at the root automatically.

`railway.json` is already configured:
```json
{
  "build": { "builder": "DOCKERFILE", "dockerfilePath": "Dockerfile" },
  "deploy": {
    "startCommand": "pnpm --filter web start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 4.2 Build Arguments

The Docker build requires one build argument. Set this in the Railway service settings under **Build → Build Arguments**:

```
NEXT_PUBLIC_SITE_URL=https://your-app-domain.com
```

### 4.3 Environment Variables

Set all of the following on the **web** service:

#### Required
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXT_PUBLIC_SITE_URL=https://your-app-domain.com
BETTER_AUTH_SECRET=<random 32+ character string>
```

Generate `BETTER_AUTH_SECRET` with:
```bash
openssl rand -hex 32
```

#### Email (Resend recommended)
```
RESEND_API_KEY=re_...
MAIL_FROM=Your App <hello@yourdomain.com>
```

#### Storage (MinIO)
```
S3_ACCESS_KEY_ID=<MINIO_ROOT_USER value>
S3_SECRET_ACCESS_KEY=<MINIO_ROOT_PASSWORD value>
S3_ENDPOINT=https://<your-minio-railway-domain>
S3_REGION=us-east-1
NEXT_PUBLIC_AVATARS_BUCKET_NAME=avatars
CUSTOM_FIELDS_BUCKET_NAME=custom-fields
```

#### OAuth (optional but recommended)
```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

> For OAuth, set the callback URLs in each provider's dashboard to:
> `https://your-app-domain.com/api/auth/callback/github`
> `https://your-app-domain.com/api/auth/callback/google`

#### Stripe (if using payments)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY=price_...
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY=price_...
NEXT_PUBLIC_PRICE_ID_LIFETIME=price_...
```

#### Optional
```
NEXT_PUBLIC_DOCS_URL=https://docs.yourdomain.com
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_PIRSCH_CODE=...
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-...
```

---

## 5. Run Database Migrations

After the first successful deploy, sync the Prisma schema to production:

```bash
# From the repo root, with DATABASE_URL set
railway run --service web pnpm --filter database push
```

Or connect directly:
```bash
DATABASE_URL="postgresql://..." pnpm --filter database push
```

To seed an initial admin user:
```bash
railway run --service web pnpm --filter database seed
```

> Default seed credentials: `hello@noba.cc` / `LaunchClub2025!`
> Override with `SEED_ADMIN_PASSWORD` env var.

---

## 6. Custom Domain

1. In Railway, go to the web service → **Settings → Networking → Custom Domain**
2. Add your domain and copy the CNAME record to your DNS provider
3. Wait for SSL provisioning (usually a few minutes)
4. Update `NEXT_PUBLIC_SITE_URL` and `MINIO_API_CORS_ALLOW_ORIGIN` to the new domain
5. Trigger a redeploy

---

## 7. Stripe Webhook

Once the domain is live, register the webhook endpoint in Stripe:

1. Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-app-domain.com/api/webhooks/stripe`
3. Select all events (or at minimum: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`)
4. Copy the signing secret and set `STRIPE_WEBHOOK_SECRET` on the web service

---

## 8. Verifying the Deployment

Check these endpoints after deploy:

```
GET  https://your-app-domain.com/           → marketing or redirect
GET  https://your-app-domain.com/auth/login → login page
GET  https://your-app-domain.com/api/health → should return 200
```

Check Railway logs:
```bash
railway logs --service web
```

---

## Redeployment & Schema Changes

When you push schema changes to `packages/database/prisma/schema.prisma`:

1. Deploy the new code (Railway auto-deploys on push)
2. Run the push command to sync the schema:
   ```bash
   railway run --service web pnpm --filter database push
   ```

> The project uses `prisma push` rather than migration files. There are no migration files to run.

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public URL of the app (also a build arg) |
| `BETTER_AUTH_SECRET` | Yes | 32+ char secret for session signing |
| `RESEND_API_KEY` | Yes | Email provider key |
| `MAIL_FROM` | Yes | From address for outbound email |
| `S3_ACCESS_KEY_ID` | Yes | MinIO/S3 access key |
| `S3_SECRET_ACCESS_KEY` | Yes | MinIO/S3 secret key |
| `S3_ENDPOINT` | Yes | MinIO/S3 endpoint URL |
| `S3_REGION` | Yes | Region (use `us-east-1` for MinIO) |
| `NEXT_PUBLIC_AVATARS_BUCKET_NAME` | Yes | Default: `avatars` |
| `CUSTOM_FIELDS_BUCKET_NAME` | Yes | Default: `custom-fields` |
| `STRIPE_SECRET_KEY` | If using payments | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | If using payments | Stripe webhook signing secret |
| `GITHUB_CLIENT_ID` | If using OAuth | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | If using OAuth | GitHub OAuth app secret |
| `GOOGLE_CLIENT_ID` | If using OAuth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | If using OAuth | Google OAuth client secret |
| `OPENAI_API_KEY` | If using AI features | OpenAI API key |
