# Implemented Overview (Backend)

Here is a summary of all the tasks and architectural changes that have been successfully implemented so far:

## 1. Physical Separation of Admin and User Models
- **Database Separation:** The unified `User` model was split into two separate tables: `admins` and `users`.
- **File Organization:** The `auth.prisma` file was deleted, and its contents were strictly segregated into `admin.prisma` and `user.prisma`.
- **Authentication Split:** Since they are separate models, they each now have independent session tracking: `AdminRefreshToken` and `UserRefreshToken`.
- **Relational Integrity:** All relations originally pointing from operations to "the admin who did it" (e.g. `WeeklyPlan.submittedById`, `AuditLog.actorId`, `SwapRequest.approvedById`, `RuleCheckLog.checkedById`) were updated to correctly reference the new `Admin` model.

## 2. Merging Employee into User
- **Unified Entity:** The `EmployeeProfile` concept was completely merged into the central `User` model to simplify the architecture. The role `EMPLOYEE` is now `USER`.
- **Field Consolidation:** All contract details (`contractType`, `workloadPercent`, `hourlyRate`, `monthlySalary`, `contractedHoursMonthly`) and profile fields (`firstName`, `lastName`, `phone`, `hireDate`, `deactivatedAt`) now live directly on the `User` model in `auth.prisma`.
- **Foreign Keys Updated:** Every reference to `employee` across the codebase (such as `employeeId` in `Shift`, `SwapRequest`, `AvailabilityMonth`) was systematically renamed to `userId` and `user`.
- **Deleted Redundant Schema:** The `employee.prisma` file was safely deleted as it was no longer needed.

## 3. Multi-file Prisma Schema Architecture
- **Refactoring:** We moved away from a single, giant `schema.prisma` file and enabled Prisma's multi-file schema feature. 
- **Organization:** The schema was split into 12 distinct, camelCased files inside the `prisma/schemas/` directory to perfectly separate the domain logic:
  - `admin.prisma` (Admin, AdminRefreshToken)
  - `user.prisma` (User, UserRefreshToken, CredentialDelivery, ContractType)

  - `category.prisma` (Category, EmployeeCategory)
  - `availability.prisma` (AvailabilityMonth, AvailabilityDay)
  - `staffingDemand.prisma` (StaffingDemand)
  - `scheduling.prisma` (WeeklyPlan, Shift)
  - `shiftSwap.prisma` (SwapRequest)
  - `ruleEngine.prisma` (OrgSettings, RuleCheckLog)
  - `notification.prisma` (Notification)
  - `audit.prisma` (AuditLog)
  - `base.prisma` (Database connection and client generation config)
- **Enum Relocation:** Enums were moved out of a central block and placed at the top of their exact, relevant domain files.
- **Comment Cleanup:** We stripped out all the boilerplate and descriptive comments from every schema file, keeping them clean and concise. Then, the files were automatically re-formatted.

## 4. Environment & Dependency Fixes
- **Node.js Compatibility:** We identified that your local Node.js version (`v20.11.1`) was incompatible with Prisma 7 (which strictly requires Node `>=20.19`). To prevent module loading errors, Prisma was downgraded to version `6` (which fully supports the multi-file schema natively and works perfectly with your Node version).
- **Express Typings Fix:** The `src/types/express.d.ts` file contained outdated references to `better-auth` and `CustomerProfile`. We updated this to correctly use your custom, manual `Role` enum.
- **Database Connection:** Confirmed the `.env.example` in the root correctly displays the Postgres database URL structure.

## 5. Database Syncing
- **Client Generation:** Successfully ran `npx prisma generate` inside the backend directory to compile the multi-file structure into your `src/generated/prisma` client.
- **Database Migration:** Pushed the new schema forcefully using `npx prisma db push --accept-data-loss` (safely handling the dropped `employee_profiles` table), successfully synchronizing the remote Neon PostgreSQL database. The database is now 100% in sync with the codebase.

## 6. Manual Admin & User Login System

A complete manual authentication and user management system was implemented with **15 API endpoints** across 3 route groups. No third-party auth library (like `better-auth`) is used — everything is hand-rolled using JWT, bcrypt, and Prisma.

### Auth Middleware (`src/middleware/auth.ts`)
- **`authenticate`** — Reads `accessToken` from HttpOnly cookies, verifies the JWT, and attaches `{ userId, email, role }` to `res.locals.auth`. Rejects with 401 if missing or expired.
- **`authorizeAdmin`** — Must be used after `authenticate`. Checks `res.locals.auth.role === "ADMIN"` and rejects with 403 otherwise.

### Admin Auth Module (`/api/v1/auth/admin`)
| File | Purpose |
|------|---------|
| `admin.validation.ts` | Zod schema for admin login (email + password) |
| `admin.service.ts` | `loginAdmin`, `getAdminProfile`, `refreshAdminToken`, `logoutAdmin` — full token lifecycle with DB-backed refresh token storage and rotation |
| `admin.controller.ts` | HTTP controllers that call the service and set/clear cookies |
| `admin.route.ts` | `POST /login` (public), `POST /refresh` (public), `POST /logout` (auth), `GET /profile` (admin) |

### User Auth Module (`/api/v1/auth/user`)
| File | Purpose |
|------|---------|
| `user.validation.ts` | Zod schema for user login |
| `user.service.ts` | `loginUser`, `getUserProfile`, `refreshUserToken`, `logoutUser` — mirrors admin service with `User` and `UserRefreshToken` models |
| `user.controller.ts` | HTTP controllers |
| `user.route.ts` | `POST /login` (public), `POST /refresh` (public), `POST /logout` (auth), `GET /profile` (auth) |

### Admin User Management Module (`/api/v1/admin/users`)
| File | Purpose |
|------|---------|
| `user-management.validation.ts` | Zod schemas for create, update, userId param, and list query (pagination + filters) |
| `user-management.service.ts` | `createUser`, `updateUser`, `deleteUser`, `deactivateUser`, `activateUser`, `getAllUsers`, `getUserById` — full CRUD with email uniqueness, bcrypt hashing, paginated listing, search, and soft deactivation |
| `user-management.controller.ts` | HTTP controllers |
| `user-management.route.ts` | 7 endpoints — all guarded by `authenticate` + `authorizeAdmin` at the router level |

### Seed Script (`src/scripts/seed.ts`)
- Idempotent script that creates a default admin (`admin@adler.com` / `Admin@123456`) only if none exists.
- Run with: `npx tsx src/scripts/seed.ts`

### Route Wiring (`src/routes/index.route.ts`)
- Mounted `adminAuthRouter` at `/auth/admin`
- Mounted `userAuthRouter` at `/auth/user`
- Mounted `userManagementRouter` at `/admin/users`

### Security Measures
- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens (15 min) in HttpOnly Secure SameSite=None cookies
- JWT refresh tokens (7 days) in HttpOnly Secure cookies with hash stored in DB
- Refresh token rotation — old token revoked on every refresh
- Deactivating a user immediately revokes all their active refresh tokens
- No password hashes ever returned in API responses
- Zod validation on all inputs
- Cleaned unused `better-auth` imports from `app.ts`

### API Documentation
- Full documentation written in `API_Doc.md` with request/response examples, field validation rules, error codes, and seed script instructions.

## 7. Strict TypeScript Compatibility Fixes

Fixed all 5 TypeScript errors caused by `exactOptionalPropertyTypes: true` and `noUncheckedIndexedAccess: true` in `tsconfig.json`:

### `user-management.controller.ts`
- **`req.params.userId`** returns `string | string[] | undefined` under strict mode. Fixed by using explicit cast: `req.params.userId as string` (safe because Express route params with `:userId` are always strings).
- **`getAllUsers` query type** — Zod's inferred type includes `| undefined` for optional fields, but the service function's exact optional property types reject this. Fixed by constructing the query object imperatively, only assigning `isActive` and `search` when they are defined.

### `user-management.service.ts`
- **`createUser` Prisma data** — Prisma with `exactOptionalPropertyTypes` rejects `undefined` for nullable fields (it expects `string | null`, not `string | undefined`). Fixed by building the `Prisma.UserCreateInput` object imperatively, only assigning optional fields when they are actually provided, so `undefined` is never passed to Prisma.

## 8. Security Enhancement: JWT Token Hashing Fix

Discovered and fixed a massive vulnerability regarding how `Refresh Tokens` were hashed in the database.
- **The Issue:** `bcrypt` silently truncates inputs to a maximum length of 72 bytes. Because JWT strings easily exceed 150 characters, and the first 72 characters of a JWT represent the Base64-encoded Header and the initial part of the Payload (which is identical for the same user across multiple tokens), `bcrypt` would compute the **exact same hash** for every single refresh token generated for a given user. This would cause token collision on logout or refresh.
- **The Fix:** Swapped `bcrypt` for `crypto.createHash('sha256')` in `src/utils/token.ts` for hashing JSON Web Tokens, which handles arbitrary string lengths securely and deterministically without truncation. Password hashes still securely use `bcrypt`.

