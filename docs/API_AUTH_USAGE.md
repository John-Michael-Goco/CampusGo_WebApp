# CampusGo Auth API – Usage Guide

Base URL (adjust for your environment):

- **Local:** `http://localhost:8000/api`  
- **Production:** `https://your-domain.com/api`

All requests that send a body must use:

- **Header:** `Content-Type: application/json`

Protected routes require:

- **Header:** `Authorization: Bearer <your_token>`

---

## 1. Health check (no auth)

**Endpoint:** `GET /api/health`

**Headers:** None required.

**Request body:** None.

**Response (200):**

```json
{
  "ok": true
}
```

**Example (curl):**

```bash
curl -X GET "http://localhost:8000/api/health"
```

---

## 2. Sign in

**Endpoint:** `POST /api/auth/signin`

**Headers:**

- `Content-Type: application/json`

**Request body (JSON):**

```json
{
  "email": "student@example.com",
  "password": "your_password"
}
```

Optional:

```json
{
  "email": "student@example.com",
  "password": "your_password",
  "device_name": "My Phone"
}
```

`device_name` is a label for the token (e.g. device or app name). If omitted, it defaults to `"api"`.

**Success response (200):**

```json
{
  "token": "1|abc123...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Dela Cruz, Juan",
    "email": "student@example.com",
    "role": "student",
    "master_student_id": 1,
    "master_professor_id": null,
    "quests_completed_count": 0,
    "gm_quest_credit": 0,
    "total_points": 0,
    "created_at": "2025-01-15T10:00:00.000000Z",
    "updated_at": "2025-01-15T10:00:00.000000Z"
  }
}
```

**Error response (422 – validation or wrong credentials):**

```json
{
  "message": "The provided credentials are incorrect.",
  "errors": {
    "email": ["The provided credentials are incorrect."]
  }
}
```

**Example (curl):**

```bash
curl -X POST "http://localhost:8000/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"your_password"}'
```

**Usage:** Save the `token` and send it in the `Authorization` header for protected endpoints.

---

## 3. Sign up (student registration)

**Endpoint:** `POST /api/auth/signup`

**Headers:**

- `Content-Type: application/json`

**Request body (JSON):**

```json
{
  "student_number": "2024-00123",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "course": "BSIT",
  "year_level": 1,
  "email": "juan.delacruz@example.com",
  "password": "securePassword123"
}
```

| Field            | Type   | Required | Rules                                      |
|------------------|--------|----------|--------------------------------------------|
| student_number   | string | Yes      | Must exist in students masterlist          |
| first_name       | string | Yes      | Max 255 chars                              |
| last_name        | string | Yes      | Max 255 chars                              |
| course           | string | Yes      | Max 255 chars, must match masterlist       |
| year_level       | int    | Yes      | 1–10, must match masterlist                |
| email            | string | Yes      | Valid email, unique in `users`             |
| password        | string | Yes      | Min 8 characters                            |
| device_name      | string | No       | Token label (default: `"api"`)             |

**Success response (200):** Same shape as sign in:

```json
{
  "token": "2|xyz789...",
  "token_type": "Bearer",
  "user": { ... }
}
```

**Error responses (422):**

- Student number not in masterlist:

```json
{
  "message": "Student number not found in masterlist.",
  "errors": {
    "student_number": ["Student number not found in masterlist."]
  }
}
```

- Already registered:

```json
{
  "errors": {
    "student_number": ["This student number is already registered."]
  }
}
```

- Details don’t match masterlist:

```json
{
  "errors": {
    "student_number": ["Student details do not match the masterlist."]
  }
}
```

- Email already used / validation:

```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

**Example (curl):**

```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "student_number": "2024-00123",
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "course": "BSIT",
    "year_level": 1,
    "email": "juan.delacruz@example.com",
    "password": "securePassword123"
  }'
```

---

## 4. Get current user (protected)

**Endpoint:** `GET /api/user`

**Headers:**

- `Authorization: Bearer <token>`

**Request body:** None.

**Success response (200):**

```json
{
  "id": 1,
  "name": "Dela Cruz, Juan",
  "email": "student@example.com",
  "role": "student",
  "master_student_id": 1,
  "master_professor_id": null,
  "quests_completed_count": 0,
  "gm_quest_credit": 0,
  "total_points": 0,
  "created_at": "2025-01-15T10:00:00.000000Z",
  "updated_at": "2025-01-15T10:00:00.000000Z"
}
```

**Error (401 – missing or invalid token):**

```json
{
  "message": "Unauthenticated."
}
```

**Example (curl):**

```bash
curl -X GET "http://localhost:8000/api/user" \
  -H "Authorization: Bearer 1|your_token_here"
```

---

## 5. Sign out (protected)

**Endpoint:** `POST /api/auth/signout`

**Headers:**

- `Authorization: Bearer <token>`

**Request body:** None.

**Success response (200):**

```json
{
  "message": "Signed out successfully."
}
```

The current token is deleted and can no longer be used.

**Error (401):** Same as “Get current user” if token is missing or invalid.

**Example (curl):**

```bash
curl -X POST "http://localhost:8000/api/auth/signout" \
  -H "Authorization: Bearer 1|your_token_here"
```

---

## Quick reference

| Action     | Method | Endpoint             | Auth required |
|-----------|--------|----------------------|----------------|
| Health    | GET    | `/api/health`        | No             |
| Sign in   | POST   | `/api/auth/signin`   | No             |
| Sign up   | POST   | `/api/auth/signup`  | No             |
| Get user  | GET    | `/api/user`         | Yes (Bearer)   |
| Sign out  | POST   | `/api/auth/signout` | Yes (Bearer)   |

**Typical flow:**

1. **Sign up:** `POST /api/auth/signup` with student details + email + password → get `token` and `user`.
2. **Sign in:** `POST /api/auth/signin` with email + password → get `token` and `user`.
3. **Use API:** Send `Authorization: Bearer <token>` on every request to `/api/user` and other protected routes.
4. **Sign out:** `POST /api/auth/signout` with the same token → token is revoked.
