# 📖 Adler Restaurant Management System — API Documentation

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** JWT tokens stored in HttpOnly cookies. Login endpoints set cookies automatically. Protected routes require a valid `accessToken` cookie.

---

## Table of Contents

- [Authentication — Admin](#authentication--admin)
  - [Admin Login](#admin-login)
  - [Admin Refresh Token](#admin-refresh-token)
  - [Admin Logout](#admin-logout)
  - [Admin Profile](#admin-profile)
- [Authentication — User](#authentication--user)
  - [User Login](#user-login)
  - [User Refresh Token](#user-refresh-token)
  - [User Logout](#user-logout)
  - [User Profile](#user-profile)
- [Admin — User Management](#admin--user-management)
  - [Create User](#create-user)
  - [List Users](#list-users)
  - [Get User by ID](#get-user-by-id)
  - [Update User](#update-user)
  - [Delete User](#delete-user)
  - [Deactivate User](#deactivate-user)
  - [Activate User](#activate-user)
- [Seed Script](#seed-script)
- [Error Response Format](#error-response-format)

---

## Authentication — Admin

### Admin Login

Creates a new authenticated session for an admin.

| | |
|---|---|
| **URL** | `/auth/admin/login` |
| **Method** | `POST` |
| **Auth** | None |

**Request Body:**

```json
{
  "email": "admin@adler.com",
  "password": "Admin@123456"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | ✅ | Valid email |
| `password` | string | ✅ | Min 6 characters |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Admin logged in successfully.",
  "data": {
    "admin": {
      "id": "clxyz...",
      "email": "admin@adler.com",
      "firstName": "Adler",
      "lastName": "Admin"
    }
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Cookies Set:**
| Name | HttpOnly | Secure | SameSite | Max Age |
|------|----------|--------|----------|---------|
| `accessToken` | ✅ | ✅ | None | 60 min |
| `refreshToken` | ✅ | ✅ | None | 2 days |

**Error Responses:**

| Status | Message |
|--------|---------|
| 401 | Invalid email or password. |
| 403 | This admin account has been deactivated. |
| 400 | Validation error (missing/invalid fields) |

---

### Admin Refresh Token

Rotates the access and refresh tokens using the refresh token cookie.

| | |
|---|---|
| **URL** | `/auth/admin/refresh` |
| **Method** | `POST` |
| **Auth** | Refresh token cookie |

**Request Body:** None (reads `refreshToken` from cookie)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tokens refreshed successfully.",
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Cookies Set:** New `accessToken` and `refreshToken` cookies (same config as login).

**Error Responses:**

| Status | Message |
|--------|---------|
| 401 | No refresh token provided. |
| 401 | Invalid or expired refresh token. |
| 401 | Refresh token not found or already revoked. |
| 403 | Admin account not found or deactivated. |

---

### Admin Logout

Revokes the current refresh token and clears all auth cookies.

| | |
|---|---|
| **URL** | `/auth/admin/logout` |
| **Method** | `POST` |
| **Auth** | `accessToken` cookie |

**Request Body:** None

**Success Response (200):**

```json
{
  "success": true,
  "message": "Admin logged out successfully.",
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Cookies Cleared:** `accessToken`, `refreshToken`

---

### Admin Profile

Returns the authenticated admin's profile.

| | |
|---|---|
| **URL** | `/auth/admin/profile` |
| **Method** | `GET` |
| **Auth** | `accessToken` cookie (Admin only) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Admin profile fetched successfully.",
  "data": {
    "admin": {
      "id": "clxyz...",
      "email": "admin@adler.com",
      "firstName": "Adler",
      "lastName": "Admin",
      "isActive": true,
      "lastLoginAt": "2026-07-03T11:00:00.000Z",
      "createdAt": "2026-07-01T00:00:00.000Z",
      "updatedAt": "2026-07-03T11:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 401 | Authentication required. No access token provided. |
| 403 | Access denied. Admin privileges required. |
| 404 | Admin not found. |

---

## Authentication — User

### User Login

Creates a new authenticated session for a user. **Users cannot sign up** — they must be created by an admin first.

| | |
|---|---|
| **URL** | `/auth/user/login` |
| **Method** | `POST` |
| **Auth** | None |

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "UserPass123"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | ✅ | Valid email |
| `password` | string | ✅ | Min 6 characters |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User logged in successfully.",
  "data": {
    "user": {
      "id": "clxyz...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "mustChangePassword": true
    }
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Cookies Set:** Same as admin login (`accessToken` + `refreshToken`).

**Error Responses:**

| Status | Message |
|--------|---------|
| 401 | Invalid email or password. |
| 403 | Your account has been deactivated. Please contact admin. |
| 400 | Validation error |

---

### User Refresh Token

Rotates the access and refresh tokens using the refresh token cookie.

| | |
|---|---|
| **URL** | `/auth/user/refresh` |
| **Method** | `POST` |
| **Auth** | Refresh token cookie |

**Request Body:** None

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tokens refreshed successfully.",
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 401 | No refresh token provided. |
| 401 | Invalid or expired refresh token. |
| 403 | User account not found or deactivated. |

---

### User Logout

Revokes the current refresh token and clears all auth cookies.

| | |
|---|---|
| **URL** | `/auth/user/logout` |
| **Method** | `POST` |
| **Auth** | `accessToken` cookie |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User logged out successfully.",
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

---

### User Profile

Returns the authenticated user's profile.

| | |
|---|---|
| **URL** | `/auth/user/profile` |
| **Method** | `GET` |
| **Auth** | `accessToken` cookie |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User profile fetched successfully.",
  "data": {
    "user": {
      "id": "clxyz...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "contractType": "HOURLY",
      "workloadPercent": null,
      "hourlyRate": "15.00",
      "monthlySalary": null,
      "contractedHoursMonthly": null,
      "hireDate": "2026-01-15T00:00:00.000Z",
      "isActive": true,
      "mustChangePassword": false,
      "lastLoginAt": "2026-07-03T11:00:00.000Z",
      "createdAt": "2026-01-15T00:00:00.000Z",
      "updatedAt": "2026-07-03T11:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

---

## Admin — User Management

> All endpoints in this section require **admin authentication** (`accessToken` cookie with admin role).

### Create User

Admin manually creates a new user account with email and password.

| | |
|---|---|
| **URL** | `/admin/users` |
| **Method** | `POST` |
| **Auth** | Admin only |

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "UserPass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "contractType": "HOURLY",
  "hourlyRate": 15.00,
  "hireDate": "2026-01-15T00:00:00.000Z"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | ✅ | Valid email, unique |
| `password` | string | ✅ | Min 6 characters |
| `firstName` | string | ❌ | |
| `lastName` | string | ❌ | |
| `phone` | string | ❌ | |
| `contractType` | enum | ❌ | `HOURLY` \| `MONTHLY_SALARY` \| `WORKLOAD_PERCENT` |
| `workloadPercent` | number | ❌ | 0–100 |
| `hourlyRate` | number | ❌ | ≥ 0 |
| `monthlySalary` | number | ❌ | ≥ 0 |
| `contractedHoursMonthly` | number | ❌ | ≥ 0 |
| `hireDate` | ISO 8601 | ❌ | Valid datetime |

**Success Response (201):**

```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "user": {
      "id": "clxyz...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "contractType": "HOURLY",
      "workloadPercent": null,
      "hourlyRate": "15.00",
      "monthlySalary": null,
      "contractedHoursMonthly": null,
      "hireDate": "2026-01-15T00:00:00.000Z",
      "isActive": true,
      "mustChangePassword": true,
      "createdAt": "2026-07-03T11:00:00.000Z",
      "updatedAt": "2026-07-03T11:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 401 | Authentication required. |
| 403 | Access denied. Admin privileges required. |
| 409 | A user with this email already exists. |
| 400 | Validation error |

---

### List Users

Returns a paginated list of users with optional filtering and search.

| | |
|---|---|
| **URL** | `/admin/users` |
| **Method** | `GET` |
| **Auth** | Admin only |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max 100) |
| `isActive` | `"true"` \| `"false"` | — | Filter by active status |
| `search` | string | — | Search by email, firstName, or lastName |

**Example:** `GET /admin/users?page=1&limit=10&isActive=true&search=john`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Users fetched successfully.",
  "data": {
    "users": [
      {
        "id": "clxyz...",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890",
        "contractType": "HOURLY",
        "isActive": true,
        "lastLoginAt": "2026-07-03T11:00:00.000Z",
        "hireDate": "2026-01-15T00:00:00.000Z",
        "createdAt": "2026-01-15T00:00:00.000Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### Get User by ID

Returns full details of a specific user.

| | |
|---|---|
| **URL** | `/admin/users/:userId` |
| **Method** | `GET` |
| **Auth** | Admin only |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User fetched successfully.",
  "data": {
    "user": {
      "id": "clxyz...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "contractType": "HOURLY",
      "workloadPercent": null,
      "hourlyRate": "15.00",
      "monthlySalary": null,
      "contractedHoursMonthly": null,
      "hireDate": "2026-01-15T00:00:00.000Z",
      "isActive": true,
      "mustChangePassword": false,
      "lastLoginAt": "2026-07-03T11:00:00.000Z",
      "deactivatedAt": null,
      "createdAt": "2026-01-15T00:00:00.000Z",
      "updatedAt": "2026-07-03T11:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 404 | User not found. |

---

### Update User

Updates a user's profile, email, or password.

| | |
|---|---|
| **URL** | `/admin/users/:userId` |
| **Method** | `PATCH` |
| **Auth** | Admin only |

**Request Body** (all fields optional):

```json
{
  "email": "john.new@example.com",
  "password": "NewPassword123",
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phone": "+9876543210",
  "contractType": "MONTHLY_SALARY",
  "monthlySalary": 3500.00,
  "mustChangePassword": false
}
```

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | Valid email, unique |
| `password` | string | Min 6 characters (will be hashed) |
| `firstName` | string | |
| `lastName` | string | |
| `phone` | string | |
| `contractType` | enum | `HOURLY` \| `MONTHLY_SALARY` \| `WORKLOAD_PERCENT` |
| `workloadPercent` | number | 0–100 |
| `hourlyRate` | number | ≥ 0 |
| `monthlySalary` | number | ≥ 0 |
| `contractedHoursMonthly` | number | ≥ 0 |
| `hireDate` | ISO 8601 | |
| `mustChangePassword` | boolean | |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User updated successfully.",
  "data": {
    "user": { "..." }
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 404 | User not found. |
| 409 | A user with this email already exists. |

---

### Delete User

Permanently deletes a user and all their associated data (tokens, etc.).

| | |
|---|---|
| **URL** | `/admin/users/:userId` |
| **Method** | `DELETE` |
| **Auth** | Admin only |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User deleted successfully.",
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 404 | User not found. |

---

### Deactivate User

Soft-disables a user account. Revokes all their active refresh tokens immediately.

| | |
|---|---|
| **URL** | `/admin/users/:userId/deactivate` |
| **Method** | `PATCH` |
| **Auth** | Admin only |

**Request Body:** None

**Success Response (200):**

```json
{
  "success": true,
  "message": "User deactivated successfully.",
  "data": {
    "user": {
      "id": "clxyz...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": false,
      "deactivatedAt": "2026-07-03T11:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 400 | User is already deactivated. |
| 404 | User not found. |

---

### Activate User

Re-enables a previously deactivated user account.

| | |
|---|---|
| **URL** | `/admin/users/:userId/activate` |
| **Method** | `PATCH` |
| **Auth** | Admin only |

**Request Body:** None

**Success Response (200):**

```json
{
  "success": true,
  "message": "User activated successfully.",
  "data": {
    "user": {
      "id": "clxyz...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true
    }
  },
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| 400 | User is already active. |
| 404 | User not found. |

---

## Seed Script

To create the default admin account, run:

```bash
npx tsx src/scripts/seed.ts
```

**Default Admin Credentials:**

| Field | Value |
|-------|-------|
| Email | `admin@adler.com` |
| Password | `Admin@123456` |

> ⚠️ **Change this password after first login in production.**

The script is idempotent — it will skip if the admin already exists.

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message.",
  "errors": ["field-level errors (if validation)"],
  "meta": {
    "timestamp": "2026-07-03T11:00:00.000Z"
  }
}
```

**Common Error Codes:**

| Status | Meaning |
|--------|---------|
| 400 | Bad Request — validation error or invalid input |
| 401 | Unauthorized — missing or invalid authentication |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found — resource doesn't exist |
| 409 | Conflict — duplicate resource (e.g., email) |
| 500 | Internal Server Error |
