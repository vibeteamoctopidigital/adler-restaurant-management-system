# Deploying the backend to Vercel

This backend is an Express app adapted to run as a **Vercel serverless function**.
Everything needed is already in the repo — follow the steps below.

## What's wired up

| File | Purpose |
|------|---------|
| `api/index.ts` | Serverless entry — exports the Express `app` as the request handler (no `app.listen()`). |
| `vercel.json` | Routes every path to the function, bundles the Prisma engine (`includeFiles`), pins region `iad1`. |
| `src/lib/prisma.ts` | Reuses one Pool + PrismaClient across warm invocations (won't exhaust DB connections). |
| `prisma/schemas/base.prisma` | `binaryTargets` includes `rhel-openssl-3.0.x` so the query engine matches Vercel's runtime. |
| `postinstall` (package.json) | Runs `prisma generate` during install so the client is built on Vercel. |

Local development is unchanged: `npm run dev` still uses `src/server.ts` (which calls `app.listen()`).

## Step 1 — Import the project

1. In Vercel, **New Project → import this Git repo**.
2. **Set the Root Directory to `backend`.** This is a monorepo (the repo also contains the frontend), so Vercel must build from `backend/`, where `vercel.json` lives. **This is the most common cause of a failed deploy.**
3. Leave the **Build Command** and **Output Directory** empty — `vercel.json` drives the build. (Do **not** set it to `npm run build`; that script runs `prisma migrate deploy`, which you don't want here.)

## Step 2 — Environment variables

Add these under **Project → Settings → Environment Variables** (Production, and Preview if you use it). They must be available at **build time too** (Vercel's default), because `prisma generate` reads `DATABASE_URL`.

**Required:**

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Use the Neon **pooled** connection string (the host with `-pooler`). Serverless opens many short-lived connections; the pooler prevents exhausting the DB. |
| `CLIENT_URL` | Your production frontend origin (e.g. `https://app.example.com`) — used by CORS. |
| `JWT_SECRET` | ≥ 32 chars. |
| `ACCESS_TOKEN_SECRET` | ≥ 32 chars. |
| `REFRESH_TOKEN_SECRET` | ≥ 32 chars. |

**Optional (sensible defaults if omitted):** `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`, `TRUST_PROXY_HOPS` (default `1`, correct for Vercel), `DB_POOL_MAX`, `LOG_LEVEL`.

> `NODE_ENV` is set to `production` automatically by Vercel for production deployments — you don't need to add it. The error handler only exposes internal messages/stack when `NODE_ENV === "development"`, so production stays safe by default.

## Step 3 — Deploy

Push to the connected branch (or click **Deploy**). Vercel will:

1. `npm install` → `postinstall` runs `prisma generate` (produces the Linux engine on Vercel).
2. Build `api/index.ts` with `@vercel/node`, bundling `src/generated/prisma/**` (engine included).
3. Route all traffic to the function.

## Step 4 — Verify

- `GET https://<your-deployment>/health` → `{ "status": "ok", ... }`
- `GET https://<your-deployment>/api/v1/admin/overview` → `401` (auth required — proves routing + guards work).

## Notes & caveats

- **Database:** always point `DATABASE_URL` at the **pooled** Neon endpoint for serverless. Run schema changes with `npm run migrate` (`prisma db push`) from your machine, **not** during the Vercel build.
- **Rate limiting** uses an in-memory store, so limits are **per serverless instance**, not global. That's fine for basic abuse protection; for strict global limits, back the limiter with Redis/Upstash (`@upstash/redis` is already a dependency).
- **Cookies** are `Secure` + `SameSite=None` — they work over Vercel's HTTPS. The frontend must call the API with credentials (`fetch(url, { credentials: "include" })`), and `CLIENT_URL` must match its origin.
- **Cold starts:** the first request after idle pays Prisma connect + pool setup; subsequent warm requests reuse them.
