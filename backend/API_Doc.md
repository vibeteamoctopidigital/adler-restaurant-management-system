# 📖 Adler Restaurant Management System — API Documentation

**Base URL:** `http://localhost:8000/api/v1`

**Health check:** `GET http://localhost:8000/health` → `{ "status": "ok", "uptime": <sec>, "timestamp": "..." }`

**Status:** All endpoints below are implemented and verified end-to-end (84-assertion smoke test, all passing).

---

## Conventions

### Authentication
JWT tokens are issued as **HttpOnly cookies** on login — the client never handles the raw tokens.

| Cookie | Lifetime | Purpose |
|--------|----------|---------|
| `accessToken` | 60 min | Sent automatically on every request; identifies the caller |
| `refreshToken` | 2 days | Used only by the `/refresh` endpoints to mint a new pair |

- Cookies are `HttpOnly`, `Secure`, `SameSite=None`. Browser clients must send credentials (`fetch(..., { credentials: "include" })`); CLI clients use a cookie jar.
- There are **two principals**: `ADMIN` (webapp) and `USER` (staff / mobile app). A token carries a `role`, and routes are guarded accordingly.
- Refresh tokens are **rotated** on every refresh (old one revoked) and their SHA-256 hash is stored server-side.

### Roles & route guards
| Guard | Applies to | On failure |
|-------|-----------|------------|
| `authenticate` | any protected route | `401` if no/invalid `accessToken` |
| `authorizeAdmin` | all `/admin/**` routes | `403` if the caller is not an admin |
| `authorizeUser` | staff routes (`/shifts`, `/notifications`, `/swaps`) | `403` if the caller is not a staff user |

### Success response envelope
```json
{
  "success": true,
  "message": "Human readable message.",
  "data": { "...": "..." },
  "meta": { "timestamp": "2026-07-05T05:06:09.994Z", "pagination": { "...": "..." } }
}
```
`data` and `meta.pagination` are present only where relevant.

### Error response envelope
Two shapes exist:

**Validation errors** (from the request validator) → `400`:
```json
{
  "success": false,
  "errors": [
    { "code": "too_small", "minimum": 6, "path": ["password"], "message": "Password must be at least 6 characters" }
  ]
}
```

**Application/domain errors** (not found, conflict, auth, etc.):
```json
{
  "success": false,
  "message": "A user with this email already exists.",
  "errorDetails": { "originalMessage": "A user with this email already exists." },
  "stack": "… (development only)"
}
```
> `errorDetails.originalMessage` and `stack` are only populated when `NODE_ENV=development`.

### Common status codes
| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `400` | Validation failed / bad input |
| `401` | Not authenticated (missing/expired token) |
| `403` | Authenticated but not allowed (wrong role / not the owner) |
| `404` | Resource not found |
| `409` | Conflict (duplicate, invalid state transition, resource in use) |
| `500` | Server error |

### Pagination
List endpoints accept `page` (default `1`) and `limit` and return:
```json
"meta": { "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

---

## Table of Contents
1. [Authentication — Admin](#1-authentication--admin)
2. [Authentication — Staff (User)](#2-authentication--staff-user)
3. [Admin — Overview](#3-admin--overview)
4. [Admin — Employees](#4-admin--employees)
5. [Admin — Categories](#5-admin--categories)
6. [Admin — Shifts](#6-admin--shifts)
7. [Admin — Shift Approvals](#7-admin--shift-approvals)
8. [Admin — Shift Swaps](#8-admin--shift-swaps)
9. [Admin — Reports](#9-admin--reports)
10. [Admin — Settings](#10-admin--settings)
11. [Staff — Shifts](#11-staff--shifts)
12. [Staff — Notifications](#12-staff--notifications)
13. [Staff — Shift Swaps](#13-staff--shift-swaps)
14. [Enum Reference](#14-enum-reference)
15. [Seed Script](#15-seed-script)

---

## 1. Authentication — Admin

### `POST /auth/admin/login`  · public
Body:
```json
{ "email": "admin@adler.com", "password": "Admin@123456" }
```
| Field | Type | Rules |
|-------|------|-------|
| `email` | string | valid email |
| `password` | string | min 6 chars |

`200` — sets `accessToken` + `refreshToken` cookies:
```json
{ "success": true, "message": "Admin logged in successfully.",
  "data": { "admin": { "id": "…", "email": "admin@adler.com", "firstName": "Adler", "lastName": "Admin" } } }
```
Errors: `400` invalid body · `401` wrong credentials · `403` deactivated admin.

### `POST /auth/admin/refresh`  · public (needs `refreshToken` cookie)
Rotates the token pair. `200` sets new cookies. `401` if the refresh token is missing/expired/revoked.

### `POST /auth/admin/logout`  · authenticated
Revokes the current refresh token and clears cookies. `200`.

### `GET /auth/admin/profile`  · admin
```json
{ "success": true, "data": { "admin": { "id": "…", "email": "…", "firstName": "…", "lastName": "…", "isActive": true, "lastLoginAt": "…", "createdAt": "…" } } }
```

---

## 2. Authentication — Staff (User)

Staff accounts are **created by an admin** (§4). There is no self-signup; staff log in with the email + password the admin set.

### `POST /auth/user/login`  · public
Body: `{ "email": "anna@adler.ch", "password": "Pass@123" }`

`200` — sets cookies:
```json
{ "success": true, "message": "User logged in successfully.",
  "data": { "user": { "id": "…", "email": "…", "firstName": null, "lastName": null, "mustChangePassword": true } } }
```
`401` wrong credentials · `403` deactivated account.

### `POST /auth/user/refresh`  · public (needs `refreshToken` cookie)
### `POST /auth/user/logout`  · authenticated
### `GET /auth/user/profile`  · authenticated
Returns the caller's full profile (contract, rate, contact — no password hash).

---

## 3. Admin — Overview

### `GET /admin/overview`  · admin
Dashboard stat tiles.
```json
{
  "success": true,
  "data": {
    "employees": { "active": 11, "inactive": 1, "total": 12 },
    "categories": { "total": 6, "subCategories": 3 },
    "shifts": { "draft": 2, "upcoming": 5, "awaitingApproval": 1 },
    "approvals": { "pendingResponses": 3 },
    "swaps": { "pending": 3 },
    "thisMonth": { "period": { "year": 2026, "month": 7 }, "scheduledHours": 1842, "overtime": 46, "hoursDue": 24, "wageCost": 39260 }
  }
}
```
- `shifts.draft` = shifts not yet notified · `upcoming` = notified & not ended · `awaitingApproval` = notified shifts with ≥1 pending acceptance.
- `thisMonth` is computed from admin-approved shifts in the current month (same engine as Reports).

---

## 4. Admin — Employees
Base path `/admin/users`. All routes are admin-guarded.

### `POST /admin/users`  · create employee
```json
{
  "email": "anna@adler.ch",
  "password": "Pass@123",
  "name": "Anna Müller",
  "phone": "+41790000001",
  "address": "Bahnhofstrasse 1",
  "department": "Service",
  "designation": "Head Waiter",
  "employeeType": "FULL_TIME",
  "isActive": true,
  "contractType": "MONTHLY_SALARY",
  "workloadPercent": 100,
  "hourlyRate": 28,
  "monthlySalary": 4600,
  "contractedHoursMonthly": 168,
  "hireDate": "2026-01-15T00:00:00.000Z",
  "categoryIds": ["<categoryId>", "…"]
}
```
| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | ✅ | valid email, unique |
| `password` | string | ✅ | min 6 |
| `name` | string | — | |
| `phone`, `address`, `department`, `designation` | string | — | |
| `employeeType` | enum | — | `FULL_TIME` \| `PART_TIME` |
| `isActive` | boolean | — | default `true` |
| `contractType` | enum | — | `HOURLY` \| `MONTHLY_SALARY` \| `WORKLOAD_PERCENT` |
| `workloadPercent` | number | — | 0–100 |
| `hourlyRate`, `monthlySalary`, `contractedHoursMonthly` | number | — | ≥ 0 |
| `hireDate` | string | — | ISO 8601 |
| `categoryIds` | string[] | — | must all exist (`400` otherwise) |

`201`:
```json
{ "success": true, "message": "User created successfully.",
  "data": { "user": { "id": "…", "email": "…", "name": "Anna Müller", "phone": "…", "address": "…",
    "department": "…", "designation": "…", "employeeType": "FULL_TIME", "contractType": "MONTHLY_SALARY",
    "workloadPercent": "100", "hourlyRate": "28", "monthlySalary": "4600", "contractedHoursMonthly": "168",
    "hireDate": "…", "isActive": true, "mustChangePassword": true, "createdAt": "…", "updatedAt": "…",
    "categories": [ { "id": "…", "name": "Service", "parentId": null } ] } } }
```
> Decimal fields (`hourlyRate`, `monthlySalary`, `workloadPercent`, …) are serialized as **strings**.

Errors: `400` invalid / unknown category · `409` duplicate email.

### `GET /admin/users`  · list employees
Query: `page`, `limit` (≤100, default 10), `isActive` (`true`/`false`), `search` (matches name/email/department/designation), `categoryId`.
```json
{ "success": true, "data": {
    "users": [ { "id": "…", "email": "…", "name": "Anna Müller", "phone": "…", "department": "…",
      "designation": "…", "employeeType": "FULL_TIME", "contractType": "MONTHLY_SALARY",
      "workloadPercent": "100", "hourlyRate": "28", "monthlySalary": "4600", "isActive": true,
      "lastLoginAt": "…", "hireDate": "…", "createdAt": "…",
      "categories": [ { "id": "…", "name": "Service", "parentId": null } ] } ],
    "counts": { "active": 11, "inactive": 1 } },
  "meta": { "pagination": { "page": 1, "limit": 10, "total": 12, "totalPages": 2 } } }
```
> `counts` reflects the same filters **except** `isActive`, so it always shows the full active/inactive split ("11 active · 1 inactive").

### `GET /admin/users/:userId`  · get one
Full profile incl. `categories`. `404` if not found.

### `PATCH /admin/users/:userId`  · update
Accepts any subset of the create fields, plus `mustChangePassword` (boolean). Notes:
- `password` (min 6) re-hashes the password.
- `isActive` toggles status **and** keeps `deactivatedAt` consistent (set when going inactive, cleared when reactivated).
- `categoryIds` **fully replaces** the employee's category set.
- `email` change is uniqueness-checked (`409`).

`200` → `{ "data": { "user": { …, "categories": [...] } } }`

### `DELETE /admin/users/:userId`  · hard delete
`200` `{ "message": "User deleted successfully." }` · `404` if not found.

### `PATCH /admin/users/:userId/deactivate`
Sets inactive, stamps `deactivatedAt`, and **revokes all the user's refresh tokens** (immediate logout). `400` if already inactive.

### `PATCH /admin/users/:userId/activate`
Reactivates. `400` if already active.

---

## 5. Admin — Categories
Base path `/admin/categories`. Categories are the work roles (Service, Kitchen, Bar…). Kitchen-style parents may have one level of **sub-categories** (Grill, Prep…).

### `POST /admin/categories`  · create category or sub-category
```json
{ "name": "Service", "isActive": true, "parentId": "<parentCategoryId?>" }
```
- Omit `parentId` for a top-level category; provide it to create a sub-category.
- Duplicate names are rejected **per parent** (`409`). Nesting deeper than one level → `409`.

`201` → `{ "data": { "category": { "id": "…", "name": "Service", "parentId": null, "isActive": true, "createdAt": "…", "updatedAt": "…" } } }`

### `POST /admin/categories/:categoryId/subcategories`  · add sub-category (convenience)
Body: `{ "name": "Grill" }`. Same rules as above; `404` if the parent doesn't exist, `409` if the parent is itself a sub-category or the name duplicates a sibling.

### `GET /admin/categories`  · flat list (top-level)
Query: `page`, `limit` (default 50), `isActive`, `search`. Each row includes `_count.shiftOffers`.

### `GET /admin/categories/tree`  · full tree with counts
```json
{ "success": true, "data": { "categories": [
    { "id": "…", "name": "Kitchen", "isActive": true, "createdAt": "…",
      "qualifiedCount": 4, "subCategoryCount": 2,
      "children": [ { "id": "…", "name": "Grill", "isActive": true, "qualifiedCount": 0 } ] },
    { "id": "…", "name": "Service", "qualifiedCount": 6, "subCategoryCount": 0, "children": [] }
  ] } }
```
`qualifiedCount` = number of employees assigned to that exact category.

### `GET /admin/categories/:categoryId`  · get one · `404` if missing
### `PATCH /admin/categories/:categoryId`  · body `{ "name"?, "isActive"? }` · `409` on duplicate sibling name
### `DELETE /admin/categories/:categoryId`
`409` if the category is still referenced by shifts or has sub-categories ("in use — deactivate instead"); otherwise `200`.

---

## 6. Admin — Shifts
Base path `/admin/shifts`. A **shift** is an open offer that gets broadcast to staff, who accept it; the admin then confirms (approves) who works it (§7).

### `POST /admin/shifts`  · create (draft)
```json
{
  "jobTitle": "Evening Waiter",
  "categoryId": "<categoryId>",
  "startTime": "2026-11-14T16:00:00.000Z",
  "endTime": "2026-11-14T22:00:00.000Z",
  "hourlyPrice": 28.5,
  "description": "Busy Friday service"
}
```
| Field | Required | Rules |
|-------|----------|-------|
| `jobTitle` | ✅ | 1–150 chars |
| `categoryId` | ✅ | must exist & be active (`404`/`409`) |
| `startTime`, `endTime` | ✅ | ISO 8601; `endTime` **must be after** `startTime` (`400`) |
| `hourlyPrice` | ✅ | ≥ 0 |
| `description` | — | ≤ 2000 chars |

`201` → the shift with `notifiedAt: null` (draft, not yet visible to staff), `category`, `createdById`.

### `GET /admin/shifts`  · list
Query: `page`, `limit` (default 20), `categoryId`, `notified` (`true`/`false`), `upcoming` (`true`/`false`). Each shift carries roll-up counts:
```json
{ "acceptedCount": 2, "approvedCount": 1, "pendingApprovalCount": 1, "rejectedByAdminCount": 0, "declinedCount": 0 }
```

### `GET /admin/shifts/:shiftId`  · get one (same count fields) · `404` if missing
### `PATCH /admin/shifts/:shiftId`  · update
Any subset of create fields. Time bounds are re-checked even on a partial edit (`400` if the resulting `endTime ≤ startTime`).

### `DELETE /admin/shifts/:shiftId`  · `200` (responses & swaps cascade)

### `POST /admin/shifts/:shiftId/notify`  · one-click publish
Sends an in-app notification to **every active employee** and stamps `notifiedAt` (making the shift visible to staff). Idempotent-ish: re-notifying re-sends.
```json
{ "success": true, "message": "Notification sent to 12 employee(s).",
  "data": { "shift": { …, "notifiedAt": "…" }, "notifiedCount": 12 } }
```
`409` if there are no active employees.

---

## 7. Admin — Shift Approvals
The accept-then-confirm flow. Staff **accept** a published shift (§11); the admin then **approves** who actually works it. Only approved responses count as "available/confirmed workers".

### `GET /admin/shifts/approvals`  · feed
Query: `page`, `limit`, `pendingOnly` (`true`/`false`). Returns published shifts that have volunteers.
```json
{ "success": true, "data": { "shifts": [
    { "id": "…", "jobTitle": "Evening Waiter", "startTime": "…", "endTime": "…", "hourlyPrice": "28",
      "category": { "id": "…", "name": "Service" },
      "acceptedCount": 2, "approvedCount": 0, "pendingApprovalCount": 2, "rejectedByAdminCount": 0,
      "declinedCount": 0, "available": 0,
      "volunteers": [
        { "id": "<responseId>", "status": "ACCEPTED", "approvalStatus": "PENDING", "respondedAt": "…",
          "approvedAt": null, "approvalNote": null,
          "user": { "id": "…", "name": "Anna Müller", "email": "…", "phone": "…",
                    "department": "Service", "designation": "Head Waiter", "employeeType": "FULL_TIME" } }
      ] } ] },
  "meta": { "pagination": { … } } }
```

### `GET /admin/shifts/:shiftId/responses`  · who responded + counts
```json
{ "success": true, "data": {
    "shift": { … },
    "accepted": [ { "id": "<responseId>", "status": "ACCEPTED", "approvalStatus": "APPROVED", "respondedAt": "…",
                    "approvedAt": "…", "approvalNote": null, "user": { … } } ],
    "declined": [ { … "status": "REJECTED" } ],
    "counts": { "acceptedCount": 2, "approvedCount": 1, "pendingApprovalCount": 0,
                "rejectedByAdminCount": 1, "declinedCount": 0, "total": 2, "available": 1 } } }
```
`counts.available` (= `approvedCount`) answers "how many workers are available for this shift".

### `POST /admin/shifts/:shiftId/responses/:responseId/approve`  · confirm an employee
Sets the response to `APPROVED`, records the admin, and sends the employee a **"Shift confirmed"** notification (updates their mobile status).
`200` → `{ "data": { "response": { …, "approvalStatus": "APPROVED", "approvedAt": "…" } } }`
Errors: `404` response not on this shift · `409` if the response is not `ACCEPTED`.

### `POST /admin/shifts/:shiftId/responses/:responseId/reject`  · don't assign
Body (optional): `{ "note": "Enough coverage" }`. Sets `REJECTED`, notifies the employee. Same guards.

---

## 8. Admin — Shift Swaps
Employees request to swap their **confirmed** shifts (§13); the admin approves or rejects. Approval performs the exchange atomically.

### `GET /admin/swaps`  · list
Query: `page`, `limit`, `status` (`PENDING` \| `APPROVED` \| `REJECTED` \| `CANCELLED`). Each **pending** swap carries a lightweight L-GAV `ruleCheck`.
```json
{ "success": true, "data": { "swaps": [
    { "id": "…", "status": "PENDING", "reason": "Doctor appointment", "adminNote": null, "reviewedAt": null,
      "createdAt": "…", "updatedAt": "…",
      "initiatorUser": { "id": "…", "name": "Anna Müller", "firstName": null, "lastName": null, "email": "…" },
      "recipientUser": { "id": "…", "name": "Luca Rossi", … },
      "initiatorShift": { "id": "…", "jobTitle": "Lunch Service", "startTime": "…", "endTime": "…", "category": { "id": "…", "name": "Service" } },
      "recipientShift": { "id": "…", "jobTitle": "Dinner Service", … },
      "ruleCheck": { "passed": true, "violations": [] } } ] },
  "meta": { "pagination": { … } } }
```
`ruleCheck` example on failure: `{ "passed": false, "violations": ["Would exceed 50h weekly max for Luca Rossi"] }`. It is **advisory** — the admin may still approve. `ruleCheck` is `null` for non-pending swaps.

### `POST /admin/swaps/:swapId/approve`  · approve & exchange
Body (optional): `{ "note": "OK, covered" }`. In one transaction: re-verifies both employees still hold their confirmed shifts, exchanges the two confirmed assignments, sets the swap `APPROVED`, and notifies **both** employees.
`200` → `{ "data": { "swap": { …, "status": "APPROVED" } } }`
Errors: `404` not found · `409` not pending, or a shift is no longer confirmed for its employee.

### `POST /admin/swaps/:swapId/reject`
Body (optional): `{ "note": "…" }`. Sets `REJECTED`, notifies both; shifts unchanged. `409` if not pending.

---

## 9. Admin — Reports
### `GET /admin/reports`  · per-employee hours & wage
Query: `year` (2000–2100), `month` (1–12), `categoryId`. Defaults to the current month if omitted. Hours are derived from **admin-approved** shift acceptances that fall in the month.
```json
{ "success": true, "data": {
    "period": { "year": 2026, "month": 11 },
    "summary": { "totalWorked": 1372, "overtime": 19, "hoursDue": 24, "wageCost": 39260, "employeeCount": 11 },
    "employees": [
      { "userId": "…", "name": "Anna Müller", "email": "…", "employeeType": "FULL_TIME", "contractType": "MONTHLY_SALARY",
        "workloadPercent": 100, "categories": [ { "id": "…", "name": "Service" } ],
        "contractedHours": 168, "scheduledHours": 165, "workedHours": 165,
        "overtimeHours": 0, "dueHours": 3, "hourlyRate": 28, "monthlySalary": null, "wageCost": 4620 }
    ] } }
```
- `overtimeHours` / `dueHours` are computed against `contractedHoursMonthly`.
- `wageCost` = `workedHours × hourlyRate` (falls back to fixed `monthlySalary` when there is no hourly rate).
- There is no separate time-clock yet, so `workedHours` = `scheduledHours`.

### `GET /admin/reports/export`  · CSV download
Same query. Responds with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="report-2026-11.csv"`. Columns: Employee, Email, Employee Type, Contract Type, Workload %, Categories, Contracted Hours, Scheduled Hours, Worked Hours, Overtime Hours, Due Hours, Hourly Rate, Monthly Salary, Wage Cost.

---

## 10. Admin — Settings
Single org-wide settings row (L-GAV rule limits).

### `GET /admin/settings`
On first read the row is created with Swiss L-GAV defaults.
```json
{ "success": true, "data": { "settings": {
    "id": 1, "maxDailyHours": "12.5", "maxWeeklyHours": "50", "minRestHoursBetweenShifts": "11",
    "minBreakMinutes": 30, "breakRules": null, "sessionTimeoutMinutes": 30, "notificationPrefs": null,
    "swapExpiryHours": 72, "updatedAt": "…", "updatedById": null } } }
```

### `PATCH /admin/settings`
Body — any subset (at least one field, else `400`):
| Field | Rules |
|-------|-------|
| `maxDailyHours` | 0–24 |
| `maxWeeklyHours` | 0–168 |
| `minRestHoursBetweenShifts` | 0–48 |
| `minBreakMinutes` | int 0–480 |
| `sessionTimeoutMinutes` | int 1–1440 |
| `swapExpiryHours` | int 1–720 |

`200` → updated settings (records `updatedById`).

---

## 11. Staff — Shifts
Base path `/shifts`. Staff-guarded (mobile app). Only **published** shifts (notified) are ever visible here.

### `GET /shifts`  · available shifts
Query: `page`, `limit`, `categoryId`, `mine` (`accepted` \| `rejected` \| `pending`), `upcoming` (`true`/`false`).
```json
{ "success": true, "data": { "shifts": [
    { "id": "…", "jobTitle": "Evening Waiter", "startTime": "…", "endTime": "…", "hourlyPrice": "28",
      "description": "…", "notifiedAt": "…", "category": { "id": "…", "name": "Service" },
      "myResponse": { "status": "ACCEPTED", "approvalStatus": "APPROVED", "respondedAt": "…", "approvedAt": "…" },
      "confirmedCount": 1 } ] },
  "meta": { "pagination": { … } } }
```
- `myResponse` is `null` if the caller hasn't responded. `approvalStatus` reflects whether the admin confirmed them.
- `confirmedCount` = number of admin-approved workers on the shift.

### `GET /shifts/:shiftId`  · one published shift (same shape) · `404` if not published/found
### `POST /shifts/:shiftId/respond`  · accept / decline
Body: `{ "status": "ACCEPTED" }` or `{ "status": "REJECTED" }`. Upsert — staff may change their mind up to the shift end.
`200` → `{ "data": { "response": { "id": "…", "shiftOfferId": "…", "status": "ACCEPTED", "respondedAt": "…" } } }`
Errors: `400` bad enum · `404` shift not published · `409` shift already ended.

---

## 12. Staff — Notifications
Base path `/notifications`. Staff-guarded. Scoped to the caller.

### `GET /notifications`
Query: `page`, `limit`, `unreadOnly` (`true`/`false`).
```json
{ "success": true, "data": {
    "notifications": [ { "id": "…", "type": "SHIFT_OFFER_PUBLISHED", "channel": "IN_APP", "status": "SENT",
      "title": "New shift available", "body": "Evening Waiter (Service) — tap to view and accept.",
      "payload": { "shiftOfferId": "…", "jobTitle": "…", "startTime": "…", "hourlyPrice": "28" },
      "sentAt": "…", "readAt": null, "createdAt": "…" } ],
    "unreadCount": 3 },
  "meta": { "pagination": { … } } }
```
Notification `type` values you'll see: `SHIFT_OFFER_PUBLISHED` (new shift), `SHIFT_CHANGED` (approved/not-assigned), `SWAP_REQUEST_RECEIVED`, `SWAP_REQUEST_RESULT`.

### `PATCH /notifications/read-all`  · mark all read → `{ "data": { "updatedCount": 2 } }`
### `PATCH /notifications/:notificationId/read`  · mark one read · `404` if not the caller's

---

## 13. Staff — Shift Swaps
Base path `/swaps`. Staff-guarded (mobile app). Employees request to swap their **confirmed** shifts.

### `POST /swaps`  · request a swap
```json
{ "initiatorShiftId": "<my confirmed shift>", "recipientUserId": "<colleague>",
  "recipientShiftId": "<their confirmed shift>", "reason": "Doctor appointment" }
```
Validates that **both** the caller and the recipient are currently admin-approved on the shifts named. Notifies the recipient.
`201` → `{ "data": { "swap": { …, "status": "PENDING" } } }`
Errors: `400` self-swap / same shift · `404` recipient not found · `409` a shift isn't confirmed for its employee / already ended / a duplicate pending swap exists.

### `GET /swaps`  · my swaps
Query: `page`, `limit`, `status`, `role` (`initiated` \| `received`). Returns swaps where the caller is initiator or recipient.

### `POST /swaps/:swapId/cancel`  · cancel my pending request
`200` → status `CANCELLED`. `403` if the caller isn't the initiator · `409` if not pending.

---

## 14. Enum Reference

| Enum | Values |
|------|--------|
| Role (token) | `ADMIN`, `USER` |
| `EmployeeType` | `FULL_TIME`, `PART_TIME` |
| `ContractType` | `HOURLY`, `MONTHLY_SALARY`, `WORKLOAD_PERCENT` |
| `ShiftResponseStatus` (staff accept/decline) | `ACCEPTED`, `REJECTED` |
| `ShiftApprovalStatus` (admin decision) | `PENDING`, `APPROVED`, `REJECTED` |
| `ShiftSwapStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `NotificationType` | `SHIFT_OFFER_PUBLISHED`, `SHIFT_CHANGED`, `SWAP_REQUEST_RECEIVED`, `SWAP_REQUEST_RESULT`, `WEEKLY_SHIFTS_PUBLISHED`, `AVAILABILITY_REMINDER`, `RULE_VIOLATION`, `GENERAL` |
| `NotificationChannel` | `PUSH`, `EMAIL`, `IN_APP` |
| `NotificationStatus` | `PENDING`, `SENT`, `FAILED`, `READ` |

---

## 15. Seed Script

Create the default admin (idempotent):
```bash
npx tsx src/scripts/seed.ts
```
Credentials: **`admin@adler.com`** / **`Admin@123456`** (change after first login).

---

## Endpoint Summary

| Area | Endpoints |
|------|-----------|
| Auth — Admin | 4 |
| Auth — Staff | 4 |
| Admin — Overview | 1 |
| Admin — Employees | 7 |
| Admin — Categories | 7 |
| Admin — Shifts | 6 |
| Admin — Shift Approvals | 4 |
| Admin — Shift Swaps | 3 |
| Admin — Reports | 2 |
| Admin — Settings | 2 |
| Staff — Shifts | 3 |
| Staff — Notifications | 3 |
| Staff — Shift Swaps | 3 |
| **Total** | **49** |

> **Not yet implemented (deferred scheduling engine):** weekly-plan generation ("Manage Plans"), employee availability submission, and the legacy `WeeklyPlan`-based swap/rule engine. These depend on the availability + weekly-plan models and mobile-side submission, and are documented in `implimated.md` §10–11.
