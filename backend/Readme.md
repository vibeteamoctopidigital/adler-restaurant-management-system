# Adler Restaurant Management System — Backend

REST API for a restaurant **workforce-scheduling** platform built around Swiss **L‑GAV** labour rules (max hours, rest periods, breaks). It serves two clients from one codebase:

- **Admin web app** (`ADMIN` role) — onboard staff, plan demand, post shifts, approve/confirm workers, run reports, publish schedules.
- **Staff mobile app** (`USER` role, React Native) — view the confirmed schedule, submit availability, accept/decline job offers, request shift swaps.

> **85 endpoints**, all implemented and verified end-to-end. Full request/response reference in **[`API_Doc.md`](./API_Doc.md)**; the build-by-build changelog is in **[`implimated.md`](./implimated.md)**; serverless deployment in **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**.

---

## Tech stack

| Concern | Choice |
|---|---|
| Runtime / language | Node.js 20.11+ · TypeScript (strict, incl. `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`) |
| Web framework | Express 5 |
| ORM / database | Prisma 6 · PostgreSQL (Neon) |
| Auth | Hand-rolled JWT (no third-party auth lib) — `jsonwebtoken`, `bcrypt`, `crypto` (SHA‑256) |
| Validation | Zod |
| Security | `helmet`, `cors` (allow-list + credentials), `hpp`, `express-rate-limit` |
| Logging | `pino` / `pino-http` (auth headers & cookies redacted) |
| Runtime/dev | `tsx` (watch), `esbuild` (Vercel bundle) |
| Hosting | Vercel serverless function |

---

## Quick start

```bash
# 1. Install dependencies (npm or pnpm — both lockfiles are committed)
npm install

# 2. Configure environment
cp .env.example .env          # then fill in DATABASE_URL and the three secrets

# 3. Sync the database schema and generate the Prisma client
npm run migrate               # prisma generate && prisma db push

# 4. Create the default admin (idempotent)
npm run seed                  # admin@adler.com / Admin@123456  (change after first login)

# 5. Run the dev server (hot reload)
npm run dev                   # http://localhost:8000
```

Health check: `GET http://localhost:8000/health` → `{ "status": "ok", ... }`
API base URL: `http://localhost:8000/api/v1`

```bash
# Smoke test: log in and hit a protected route with a cookie jar
curl -c jar.txt -X POST http://localhost:8000/api/v1/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@adler.com","password":"Admin@123456"}'
curl -b jar.txt http://localhost:8000/api/v1/admin/overview
```

---

## Environment variables

Copy `.env.example` → `.env`. **Required:**

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. For serverless, use the Neon **pooled** endpoint (host with `-pooler`). |
| `JWT_SECRET` | ≥ 32 chars |
| `ACCESS_TOKEN_SECRET` | ≥ 32 chars |
| `REFRESH_TOKEN_SECRET` | ≥ 32 chars |
| `CLIENT_URL` | Frontend origin, used by CORS (credentials mode) |

**Optional** (sensible defaults applied if omitted): `PORT` (default 8000), `NODE_ENV`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`, `TRUST_PROXY_HOPS` (default 1), `LOG_LEVEL`.

> If the environment is invalid at boot, the app does **not** start serving with placeholder secrets — every request returns a clear `500` naming the offending variable.

---

## npm scripts

| Script | Does |
|---|---|
| `npm run dev` | `tsx watch src/server.ts` — hot-reloading dev server |
| `npm run migrate` | `prisma generate && prisma db push` — sync schema to the DB (run **locally**, not during a build) |
| `npm run seed` | Seed the default admin (idempotent) |
| `npm run prisma:generate` | Regenerate the Prisma client only |
| `npm run build:vercel` | Bundle the app to `api/index.js` with esbuild (used by the Vercel deploy) |
| `npm run build` | `prisma generate && prisma migrate deploy && tsup` (CI/prod build) |
| `npm run start` | Run the compiled server (`dist/server.js`) |
| `npm run lint` | ESLint over `.ts` |

---

## Architecture

### Request pipeline
`helmet` → `cors` (allow-list + credentials) → `compression` → `cookie-parser` → `express.json` (1 MB cap) → `hpp` → `pino` request logging → global rate limiter → routes → `notFound` → central `errorHandler`.

### Authentication & authorization
Two principals share one JWT scheme; a token carries a `role` (`ADMIN` | `USER`).

- **Web (admin):** tokens are set as **HttpOnly `Secure` `SameSite=None` cookies**; the browser sends them automatically (`fetch(..., { credentials: "include" })`).
- **Mobile (staff):** login/refresh also **return the tokens in the response body**; the app stores them and sends `Authorization: Bearer <accessToken>`.
- **Access token** ~15 min; **refresh token** ~7 days, **rotated** on every refresh, with only its **SHA‑256 hash** stored server-side. Passwords are hashed with **bcrypt** (12 rounds). Changing a password revokes all refresh tokens and ends the session.

Middleware guards ([`src/middleware/auth.ts`](./src/middleware/auth.ts)): `authenticate` → `authorizeAdmin` / `authorizeUser` (`401` / `403`).

### Feature-folder modules
Every feature is a self-contained folder with the same four layers:

```
route.ts        paths + guards + Zod validation
  └─ controller.ts   thin HTTP in/out (uses res.locals.auth, sendSuccess)
       └─ service.ts     business logic + Prisma
            └─ validation.ts   Zod schemas + inferred types
```

```
src/
├── modules/
│   ├── admin/          # ADMIN web features
│   │   ├── auth/  overview/  employees/  categories/  shifts/  swaps/
│   │   ├── workload/  demands/  reports/  settings/  availability/
│   │   └── schedule/        # publish/unpublish a month's schedule
│   └── user/           # USER staff (mobile) features
│       ├── auth/  shifts/  notifications/  swaps/  availability/
│       └── schedule/        # "My Schedule" — confirmed, sortable day/week/month
├── middleware/         # auth, validateRequest, rateLimit, errorHandler, notFound
├── routes/index.route.ts    # mounts every feature router under /api/v1
├── config/  ·  lib/prisma.ts  ·  utils/  ·  generated/prisma/
├── scripts/seed.ts
├── server.ts           # local entry (app.listen)
└── vercel.ts           # serverless entry (export default app)
```

### Response envelope
```jsonc
// success
{ "success": true, "message": "…", "data": { … }, "meta": { "timestamp": "…", "pagination": { … } } }
// error
{ "success": false, "message": "…", "errors": [ … ] }
```
Zod validation failures → `400`; domain errors are thrown as `AppError(message, statusCode)` and normalized by the central error handler. Internal messages/stack traces are only exposed when `NODE_ENV=development`.

---

## Data model (Prisma, multi-file schema)

Schema lives in [`prisma/schemas/`](./prisma/schemas/), split per domain (admin, user, category, availability, scheduling, shiftOffer, shiftOfferSwap, demand, staffingDemand, ruleEngine, notification, audit, schedulePublication, …). Two deliberate design choices:

- **Admin and User are separate tables** (`Admin` / `User`), each with independent refresh-token tracking.
- **The live scheduling model is `ShiftOffer`** (a broadcast offer many staff can opt into) + `ShiftOfferResponse` (admin-approved = confirmed worker). The legacy `WeeklyPlan` / `Shift` / `SwapRequest` models are reserved for the still-deferred auto-scheduling engine, and are *not* overloaded by the live features.

After changing any `*.prisma` file, run `npm run migrate` (dev) to regenerate the client and push the schema.

---

## Feature surface (85 endpoints)

**Admin** — auth · overview · employees (cursor-paginated) · categories (tree + sub-categories) · shifts (offer → notify → approvals) · shift swaps (approve = atomic exchange) · workload & demands (headcount planning) · reports (+ CSV) · settings (L‑GAV rules) · availability (open/status/grid/nudge) · **schedule publishing**.

**Staff** — auth (+ change password) · shifts (accept/decline, auto-removed 1 min before start) · notifications · shift swaps (request/cancel) · availability (calendar submit) · **My Schedule** (confirmed shifts, sortable by day/week/month).

See the **[User Site — Requirements Coverage](./API_Doc.md#user-site--requirements-coverage)** table in `API_Doc.md` for the user-story → endpoint map.

---

## Testing & verification

There is no unit-test suite yet; changes are verified **end-to-end against the live server + database** with assertion scripts (documented per iteration in `implimated.md`). The type checker is the primary static gate:

```bash
npx tsc --noEmit     # must be 0 errors (strict mode)
```

The latest full user-site audit ran ~94 end-to-end assertions across all six user-facing requirements — all green (see `implimated.md` §22).

---

## Deployment

Deployed as a **Vercel serverless function** (esbuild bundles the app to `api/index.js`; `src/lib/prisma.ts` reuses one pooled `PrismaClient` across warm invocations). Set the Vercel **Root Directory to `backend`** and point `DATABASE_URL` at the Neon **pooled** endpoint. Run schema changes with `npm run migrate` from your machine, **not** during the Vercel build. Full walkthrough and troubleshooting in **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**.

---

## Not yet implemented (deferred)

The **weekly-plan auto-scheduling engine** ("Manage Plans") — turning submitted demand + availability into a rule-compliant proposed roster with per-change L‑GAV feedback — is the one large remaining piece; the demand and availability inputs it needs are already built. Also open (non-blocking): "open to the whole team" swaps (current swaps are targeted) and real clock-in/out worked-hours capture (reports currently derive hours from admin-approved shifts).
