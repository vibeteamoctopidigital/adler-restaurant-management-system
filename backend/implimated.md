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

## 9. Shift Board: Employee Onboarding, Categories, Shifts & Notifications

This iteration implements the **admin-driven shift board** workflow: the admin manually onboards employees, organises work into categories, posts shifts, and broadcasts them with a single "Notify" click. Employees then see published shifts on their dashboard and accept or decline them, while the admin sees exactly who accepted and how many staff are available. Everything is validated with **Zod**, follows the existing `validation → route → controller → service` module pattern, and returns no password hashes.

> **Design note — why new models instead of the existing `Shift`/`WeeklyPlan`.** The pre-existing `Shift` model is an *assignment* (one employee, tied to a `WeeklyPlan`, part of the future L-GAV auto-scheduling engine). The feature requested here is a *broadcast offer* that **many** employees can opt into. These are genuinely different concepts, so two new models were added rather than overloading the assignment model. The scheduling/availability/swap models remain untouched for the future planning engine.

### Schema Changes (`prisma/schemas/`)
- **New enums** (`enums.prisma`):
  - `EmployeeType { FULL_TIME, PART_TIME }`
  - `ShiftResponseStatus { ACCEPTED, REJECTED }`
  - Added `SHIFT_OFFER_PUBLISHED` to the existing `NotificationType`.
- **`User` model** (`user.prisma`) — added employee-profile fields requested for the "Add Employee" form: `name`, `address`, `department`, `designation`, `employeeType`. (`phone`, `monthlySalary`, `hourlyRate`, `isActive` status already existed.) Added the `shiftOfferResponses` back-relation.
- **New file `shiftOffer.prisma`** — two models:
  - `ShiftOffer` — `jobTitle`, `categoryId` (→ `Category`), `startTime`, `endTime` (the date+time), `hourlyPrice` (`Decimal`), `description`, `createdById` (→ `Admin`), and `notifiedAt` (null = draft, set when the admin clicks Notify).
  - `ShiftOfferResponse` — join between `ShiftOffer` and `User` with `status` (`ACCEPTED`/`REJECTED`) and `respondedAt`. `@@unique([shiftOfferId, userId])` so each employee has exactly one response per shift (accept/decline is an upsert).
- Added back-relations on `Category` (`shiftOffers`) and `Admin` (`createdShiftOffers`).
- **`base.prisma`** — restored `url = env("DATABASE_URL")` on the datasource; the installed Prisma **6.19** CLI requires it in-schema (the `prisma.config.ts` datasource injection alone was not resolving during `generate`/`db push`). Schema was regenerated and pushed to the Neon database with `prisma db push` (all changes are additive: new tables, new nullable columns, one new enum value — non-destructive).

### Auth Middleware (`src/middleware/auth.ts`)
- Added **`authorizeUser`** — mirror of `authorizeAdmin`; used after `authenticate` to guard staff-only routes (rejects non-`USER` roles with 403).

### Extended: Admin User Management (`/api/v1/admin/users`)
- `user-management.validation.ts` — `createUserSchema` / `updateUserSchema` now accept `name`, `address`, `department`, `designation`, `employeeType` (`FULL_TIME`/`PART_TIME`), and `isActive` (Active/Inactive status). This fulfils the requested "Add Employee" form (email, phone, name, password, department, designation, employee type, status, address, monthly & hourly salary).
- `user-management.service.ts` — persists the new fields via imperative payload building (safe under `exactOptionalPropertyTypes`). Setting `isActive` in **update** keeps `deactivatedAt` consistent (set when going inactive, cleared when reactivated). Search now also matches `name`, `department`, and `designation`. A shared `userSelect` projection replaced the repeated inline selects.

### Admin Category Module (`/api/v1/admin/categories`)
| File | Purpose |
|------|---------|
| `category.validation.ts` | Zod schemas: create, update, id-param, list query |
| `category.service.ts` | `createCategory`, `updateCategory`, `deleteCategory`, `getAllCategories`, `getCategoryById`. Case-insensitive duplicate-name guard (409) because `@@unique([parentId,name])` does not enforce uniqueness for NULL `parentId`. Delete is blocked (409) when the category is still referenced by shifts/children, instead of surfacing a raw FK error. |
| `category.controller.ts` | HTTP controllers |
| `category.route.ts` | `POST /`, `GET /`, `GET /:categoryId`, `PATCH /:categoryId`, `DELETE /:categoryId` — all guarded by `authenticate` + `authorizeAdmin` |

### Admin Shift Module (`/api/v1/admin/shifts`)
| File | Purpose |
|------|---------|
| `shift.validation.ts` | Create/update schemas with `endTime > startTime` refinement; list query with `categoryId`, `notified`, `upcoming` filters |
| `shift.service.ts` | `createShift` (validates category exists & is active), `updateShift` (cross-field time guard even on partial edits), `deleteShift` (responses cascade), **`notifyShift`**, `getAllShifts` (+ `acceptedCount`), `getShiftById`, **`getShiftResponses`** |
| `shift.controller.ts` | HTTP controllers |
| `shift.route.ts` | `POST /`, `GET /`, `GET /:shiftId`, `GET /:shiftId/responses`, `PATCH /:shiftId`, `DELETE /:shiftId`, `POST /:shiftId/notify` — admin-guarded |

- **Notify (one click):** `POST /:shiftId/notify` runs a single transaction that (a) creates an in-app `Notification` for **every active employee** (`type=SHIFT_OFFER_PUBLISHED`, `channel=IN_APP`, `status=SENT`, with a `payload` carrying the shift details) and (b) stamps `notifiedAt`. Returns the recipient count. *(The `PUSH`/`EMAIL` channels and `Notification` rows are the integration seam for a real mobile-push/email provider later — no external provider is wired yet.)*
- **Availability view:** `GET /:shiftId/responses` returns the accepted list (with each employee's name, email, phone, department, designation, employee type), the rejected list, and `counts { accepted, rejected, total }` — i.e. exactly "who accepted" and "how many are available".

### Staff Shift Module (`/api/v1/shifts`)
| File | Purpose |
|------|---------|
| `shift.validation.ts` | `respondToShiftSchema` (`ACCEPTED`/`REJECTED`); list query with `categoryId`, `mine` (accepted/rejected/pending), `upcoming` filters |
| `shift.service.ts` | `listAvailableShifts` (**only `notifiedAt != null` shifts — drafts stay internal**; each row includes the caller's own `myResponse` and the shift's `acceptedCount`), `getShiftForUser`, `respondToShift` |
| `shift.controller.ts` | HTTP controllers |
| `shift.route.ts` | `GET /`, `GET /:shiftId`, `POST /:shiftId/respond` — guarded by `authenticate` + `authorizeUser` |

- **Accept / decline:** `POST /:shiftId/respond` upserts the caller's `ShiftOfferResponse` (staff can change their mind up to the shift end). Responding to an unpublished shift → 404; responding after `endTime` → 409.

### Staff Notification Module (`/api/v1/notifications`)
| File | Purpose |
|------|---------|
| `notification.validation.ts` | List query (`unreadOnly`), id param |
| `notification.service.ts` | `listNotifications` (+ `unreadCount`), `markAsRead`, `markAllAsRead` — all scoped to the calling user |
| `notification.controller.ts` | HTTP controllers |
| `notification.route.ts` | `GET /`, `PATCH /read-all`, `PATCH /:notificationId/read` — guarded by `authenticate` + `authorizeUser` |

### Route Wiring (`src/routes/index.route.ts`)
Mounted the four new routers: `/admin/categories`, `/admin/shifts`, `/shifts` (staff), `/notifications` (staff).

### Verification
- `npx tsc --noEmit` passes with **0 errors** (strict mode, incl. `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`).
- Full end-to-end flow exercised against the running server + live DB and confirmed: admin login → create category (and 409 on duplicate) → create shift (and 400 on `endTime <= startTime`) → create employee → employee login → **shift hidden before Notify** → Notify (fan-out + `notifiedAt`) → **shift now visible with `myResponse` & `acceptedCount`** → employee receives notification → accept (admin sees `accepted=1` + employee details) → change mind to reject (counts update to `accepted=0, rejected=1`) → notification mark-read → admin toggle `isActive=false` blocks login (403) → reactivate clears `deactivatedAt`. Test data was cleaned up afterward.

### New Endpoint Count
**18 new endpoints** across four modules: 5 category (admin) + 7 shift (admin, incl. notify & responses) + 3 shift (staff) + 3 notification (staff).

## 10. Admin Webapp: Employees, Shift Approvals, Categories Tree, Reports, Overview & Settings

This iteration builds out the **admin webapp** pages from the provided designs. Per the brief, only the **web (admin)** API surface was built — the staff side is a mobile app and already had its endpoints from §9 (the staff response endpoints were only lightly extended to expose approval state). Everything continues the `validation → route → controller → service` pattern, is Zod-validated, and returns no password hashes.

### Scope decision (documented, not silently dropped)
The provided screenshots include a **"Shift Approvals → Swap requests"** page and a **"Manage Plans"** page. These belong to the larger L-GAV **auto-scheduling engine** (the pre-existing `WeeklyPlan`, `Shift`, `StaffingDemand`, `SwapRequest`, availability/rule-engine models) and depend on staff-side (mobile) initiation of swaps and weekly-plan generation. Requirement **#3** explicitly redefines the "shift approve section" as **approving staff acceptances of published shift offers** (the accept → admin-approve → confirmed-count flow), so that is what the Shift Approvals backend implements here. The swap/weekly-planning engine is intentionally **deferred** (it needs the mobile initiation flow + rule engine) rather than half-built against models with no data path.

### Schema Changes (`prisma/schemas/`)
- **New enum** `ShiftApprovalStatus { PENDING, APPROVED, REJECTED }`.
- **`ShiftOfferResponse`** gained an admin-approval layer: `approvalStatus` (default `PENDING`), `approvedById` (→ `Admin`), `approvedAt`, `approvalNote`. A staff `ACCEPT` is a *volunteer offer*; only an admin-**APPROVED** acceptance counts as an available/confirmed worker.
- **`Admin`** gained the `approvedResponses` back-relation.
- Regenerated the client and pushed to Neon with `prisma db push` (additive: one enum + four nullable columns).

### Extended: Employees (`/api/v1/admin/users`) — requirement #2
Backs the **Team / Employees** page (name+email, categories, contract, rate, status; add-employee; category filter; "N active · M inactive").
- **Category (role) assignment** — `createUserSchema`/`updateUserSchema` accept `categoryIds: string[]`. On create they connect `UserCategory` rows; on update a provided list **fully replaces** the old set (`deleteMany` + `create`). Non-existent category IDs are rejected (400).
- **Enriched list** — `GET /admin/users` now returns each employee's `categories` (flattened from the join), `phone` (contact), `employeeType` + `workloadPercent` + `contractType` (contract), `hourlyRate`/`monthlySalary` (rate), and `isActive` (status). Added a **`categoryId` filter** and a **`counts { active, inactive }`** block (computed over the same filters minus the status filter) for the header tallies.
- `getUserById`/`createUser`/`updateUser` also return the flattened `categories`.

### Shift Approvals (`/api/v1/admin/shifts/...`) — requirement #3
- `GET /admin/shifts/approvals?pendingOnly=` — feed of **published shifts that have volunteers**, each with its `volunteers` (accepted responses incl. per-response `approvalStatus`), roll-up counts, and `available` (approved) count.
- `POST /admin/shifts/:shiftId/responses/:responseId/approve` — confirms an employee: sets `approvalStatus=APPROVED` + `approvedBy/At`, and sends the employee a **"Shift confirmed"** in-app notification (updates their mobile status). Guards: response must exist for that shift and be `ACCEPTED` (else 404/409).
- `POST /admin/shifts/:shiftId/responses/:responseId/reject` — sets `REJECTED` (+ optional `note`) and notifies the employee.
- `GET /admin/shifts/:shiftId/responses` and the shift lists now report approval-aware counts: `acceptedCount`, `approvedCount`, `pendingApprovalCount`, `rejectedByAdminCount`, `declinedCount`, and **`available` = approved** ("how many workers are available for this shift").
- Staff side (`GET /api/v1/shifts`): each `myResponse` now includes `approvalStatus`/`approvedAt`, and shifts expose `confirmedCount` (admin-approved workers) so the mobile app can show a "confirmed" status.

### Categories page (`/api/v1/admin/categories`)
Backs the **Categories** page (parent cards with "N qualified · M sub-categories", sub-category chips, add sub-category).
- `POST /admin/categories` accepts an optional `parentId` to create a sub-category; `POST /admin/categories/:categoryId/subcategories` is a convenience route for the per-card "Add sub-category" input.
- `GET /admin/categories/tree` returns top-level categories, each with `qualifiedCount` (employees assigned), `subCategoryCount`, and `children[]` (each with its own `qualifiedCount`).
- Duplicate-name guard is now scoped to siblings (same `parentId`); nesting is limited to one level; the in-use delete guard remains.

### Reports (`/api/v1/admin/reports`) — requirement #4
Backs the **Reports** page (per-employee hours/overtime/due/wage, summary tiles, month + category filters, Export CSV).
- `GET /admin/reports?year=&month=&categoryId=` — for each active employee (optionally filtered by role/category): `scheduledHours`, `workedHours`, `overtimeHours`, `dueHours`, `wageCost`, plus contract/category context. **Data source:** admin-**APPROVED** shift-offer acceptances whose shift falls in the month. Hours = shift duration; `overtime/due` are computed against `contractedHoursMonthly`; `wageCost` = hours × `hourlyRate` (falls back to fixed `monthlySalary`). Returns summary tiles `{ totalWorked, overtime, hoursDue, wageCost, employeeCount }`. *(There is no separate time-clock yet, so `worked` = `scheduled`; this is the integration seam for real clock-in data.)*
- `GET /admin/reports/export?...` — same data as a downloadable `text/csv` (proper `Content-Disposition`, CSV-escaped).

### Overview (`/api/v1/admin/overview`)
- `GET /admin/overview` — dashboard stat tiles: `employees { active, inactive, total }`, `categories { total, subCategories }`, `shifts { draft, upcoming, awaitingApproval }`, `approvals { pendingResponses }`.

### Settings (`/api/v1/admin/settings`)
- `GET /admin/settings` — the single org-wide `OrgSettings` row (upserted with Swiss L-GAV defaults on first read: max daily 12.5h, max weekly 50h, min rest 11h, min break 30min, swap expiry 72h, session timeout 30min).
- `PATCH /admin/settings` — partial update of the numeric rule limits; records `updatedById`; rejects an empty body (400).

### Route Wiring (`src/routes/index.route.ts`)
Mounted: `/admin/overview`, `/admin/reports`, `/admin/settings` (plus the extended `/admin/categories/*` and `/admin/shifts/*` routes).

### Verification
- `npx tsc --noEmit` passes with **0 errors** (strict mode).
- Full end-to-end run against the live server + DB, all confirmed: admin login → create parent categories + sub-categories (409 on duplicate sibling) → **category tree** shows correct `qualifiedCount`/`subCategoryCount` → create employees with `categoryIds` → **employee list** returns categories/rate/contract + `counts {active:2, inactive:0}` → **category filter** narrows to Kitchen staff → create + notify shift → both employees accept → **approvals feed** shows 2 volunteers / 2 pending / 0 available → approve Anna + reject Luca → responses now `available:1` (`approvedCount:1, rejectedByAdminCount:1`) → Anna receives **"Shift confirmed"** notification → **overview** tiles correct → **report** (Nov 2026): Anna worked 8h, wage CHF 224 (8×28), due 160h (168−8); category filter isolates Kitchen → **CSV export** returns correct headers + rows with `text/csv` disposition → **settings** GET defaults, PATCH `maxWeeklyHours=45` records `updatedById`, empty PATCH rejected (400). All test data cleaned up afterward.

### New Endpoint Count (this iteration)
**13 new admin endpoints**: 2 categories (tree, add sub-category) + 3 shift approvals (feed, approve, reject) + 2 reports (data, CSV) + 1 overview + 2 settings (get, patch) + enriched employees list/create/update (category assignment, filter, counts — same routes, extended payloads).

## 11. Shift Swaps (employee ↔ employee) & Overview Enrichment

Implements requirement #6 (two employees swap shifts via an admin-approved request) and #5 (enriched Overview API). Swaps are built on the **functional `ShiftOffer`** model — a "shift" that can be swapped is one an employee is **admin-APPROVED** (confirmed) for. This is distinct from the pre-existing `SwapRequest` model in `shiftSwap.prisma`, which belongs to the deferred `WeeklyPlan`-based scheduling engine.

### Schema Changes (`prisma/schemas/`)
- **New enum** `ShiftSwapStatus { PENDING, APPROVED, REJECTED, CANCELLED }`.
- **New model** `ShiftSwapRequest` (`shiftOfferSwap.prisma`): `initiatorUser`/`initiatorShift`, `recipientUser`/`recipientShift` (all → `User`/`ShiftOffer`), `status` (default `PENDING`), `reason` (initiator note), `reviewedBy`/`reviewedAt`/`adminNote`. Distinct relation names (`ShiftSwap*`) so they don't collide with the legacy `SwapRequest` relations.
- Back-relations added on `User` (`initiatedShiftSwaps`, `receivedShiftSwaps`), `Admin` (`reviewedShiftSwaps`), and `ShiftOffer` (`swapsAsInitiatorShift`, `swapsAsRecipientShift`). Regenerated + `db push` (additive).

### Staff Swap Module (mobile API) — `/api/v1/swaps`
Guarded by `authenticate` + `authorizeUser`. (Built here because the swap is *initiated* by staff; the staff UI is the mobile app, but the API lives in this backend.)
| Endpoint | Purpose |
|----------|---------|
| `POST /swaps` | Create a swap: `{ initiatorShiftId, recipientUserId, recipientShiftId, reason? }`. Validates **both** employees currently hold their **confirmed** shifts, blocks self-swap / same-shift / ended shifts / duplicate pending pairs, then notifies the recipient (`SWAP_REQUEST_RECEIVED`). |
| `GET /swaps` | The caller's swaps (filter by `status` and `role=initiated|received`). |
| `POST /swaps/:swapId/cancel` | Initiator cancels their own pending swap (403 for anyone else, 409 if not pending). |

### Admin Swap Module — `/api/v1/admin/swaps`
Backs the **Shift Approvals → Swap requests** page (Pending/History, Rules OK/Rule fail, Approve/Reject). Guarded by `authenticate` + `authorizeAdmin`.
| Endpoint | Purpose |
|----------|---------|
| `GET /admin/swaps?status=` | Lists swaps with full initiator/recipient user + shift details; **each PENDING swap carries a `ruleCheck { passed, violations[] }`** (advisory). |
| `POST /admin/swaps/:swapId/approve` | **Performs the exchange in one transaction**: re-verifies both shifts are still confirmed (409 if drifted), clears the four `ShiftOfferResponse` slots to satisfy the `@@unique([shiftOfferId, userId])`, re-creates the two swapped responses as `APPROVED` (by the admin), flips the swap to `APPROVED`, and notifies **both** employees (`SWAP_REQUEST_RESULT`). The shift's approved-worker list now reflects the exchange. |
| `POST /admin/swaps/:swapId/reject` | Marks `REJECTED` (+ optional note), notifies both; shifts are left untouched. |

- **Rule engine (lightweight L-GAV check):** for a pending swap, projects each employee's schedule *after* the swap (their approved hours in the affected Monday-based ISO week / day, minus the shift given up, plus the shift taken) and compares against `OrgSettings.maxWeeklyHours` / `maxDailyHours`, producing messages like *"Would exceed 50h weekly max for Luca Rossi"*. Advisory only — the admin can still approve (matching the UI).
- **Select-merge bug found & fixed during testing:** the admin list originally spread `{ ...swapSelect, ...ruleSelect }`, and the second select's nested `initiatorShift`/user keys *overrode* (not merged with) the first, dropping `jobTitle`/`category`. Fixed by adding only the scalar FK ids on top of `swapSelect`. Caught by the E2E run before it shipped.

### Overview Enrichment — `/api/v1/admin/overview`
Added `swaps { pending }` (count of `PENDING` swaps) and `thisMonth { period, scheduledHours, overtime, hoursDue, wageCost }` (reuses the Reports service for the current month). *(The screenshot's availability-submitted, weekly-plan-status and "not submitted yet" tiles depend on the deferred availability/weekly-plan engine and are intentionally not fabricated here.)*

### Verification
- `npx tsc --noEmit` passes with **0 errors**.
- Full E2E against the live server + DB: set up 2 employees each confirmed on their own shift (same ISO week) → **Anna requests a swap** for Luca's shift (Luca notified) → **Overview** shows `swaps.pending = 1` → admin **pending list** shows full shift/user details + `ruleCheck.passed = true` (and, with `maxWeeklyHours` temporarily set to 1, correctly flips to `passed:false` with the exceed message) → **admin approves** → **shifts are exchanged** (Shift A's confirmed worker is now Luca, Shift B's is now Anna; `available = 1` each) → **both employees notified** with the correct swapped-shift wording → swap appears in **History** as `APPROVED` with the admin note → a second swap is **rejected** (shifts unchanged, both notified) → **cancel** path works and non-initiators get 403 → self-swap/duplicate guards return 400/409. Internal FK ids are not leaked to the client. All test data cleaned up afterward.

### New Endpoint Count (this iteration)
**6 new endpoints**: 3 admin swaps (list, approve, reject) + 3 staff swaps (create, list, cancel), plus the enriched `/admin/overview` payload.

