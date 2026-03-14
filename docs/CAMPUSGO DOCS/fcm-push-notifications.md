# FCM Push Notifications — Backend Implementation

The mobile app is adding Firebase Cloud Messaging (FCM) push notifications. This doc specifies exactly what the Laravel backend needs to implement so the mobile side can integrate.

---

## 1. Store FCM device token

### PUT `/api/user/fcm-token`
**Auth:** Yes (Bearer)

Called by the mobile app after login (and whenever the FCM token refreshes). Stores the device's FCM token so the backend can send push notifications to this user.

**Request body** (JSON)
| Field       | Type   | Required | Description                          |
|-------------|--------|----------|--------------------------------------|
| fcm_token   | string | Yes      | FCM device registration token.       |
| device_id   | string | No       | Optional device identifier (for multi-device support). |

**Backend behavior:**
- If the user already has a record with the same `fcm_token`, update `updated_at` (no-op upsert).
- If the user already has a record with the same `device_id`, replace the token.
- Otherwise, insert a new record.
- A single user can have multiple tokens (multiple devices).

**Response** `200 OK`
```json
{
  "message": "Token registered."
}
```

**Errors**
- `401` — Missing or invalid auth token.
- `422` — `fcm_token` is missing or empty.

---

### DELETE `/api/user/fcm-token`
**Auth:** Yes (Bearer)

Called on logout. Removes the device's FCM token so the user stops receiving pushes on this device.

**Request body** (JSON)
| Field       | Type   | Required | Description                     |
|-------------|--------|----------|---------------------------------|
| fcm_token   | string | Yes      | The token to remove.            |

**Response** `200 OK`
```json
{
  "message": "Token removed."
}
```

**Errors**
- `401` — Missing or invalid auth token.

---

## 2. Database: `fcm_tokens` table

```
fcm_tokens
├── id            (bigint, PK)
├── user_id       (FK → users.id, indexed)
├── fcm_token     (string, unique, indexed)
├── device_id     (string, nullable)
├── created_at    (timestamp)
└── updated_at    (timestamp)
```

- **Unique constraint** on `fcm_token` (one token = one device, regardless of user).
- **Index** on `user_id` for fast lookup when sending pushes.
- When a user logs in on a new device with a token that belonged to another user, update the `user_id` (a device can only belong to one user at a time).

---

## 3. Push notification events

The backend should send FCM data messages for the following events. Use the **FCM HTTP v1 API** (`POST https://fcm.googleapis.com/v1/projects/{project_id}/messages:send`).

### 3a. Ranking resolved (participant status change)

**When:** The ranking job/command runs and resolves a participant from `awaiting_ranking` to `advanced`, `eliminated`, or `completed`/`winner`.

**Who:** Send to the **user** who owns that participant record (look up `fcm_tokens` by `user_id`).

**FCM payload:**
```json
{
  "message": {
    "token": "<fcm_token>",
    "data": {
      "type": "ranking_resolved",
      "participant_id": "42",
      "quest_id": "5",
      "quest_title": "Campus Hunt",
      "outcome": "advanced",
      "message": "You advanced to Stage 2!"
    },
    "notification": {
      "title": "Quest Update",
      "body": "You advanced to Stage 2 in Campus Hunt!"
    }
  }
}
```

`outcome` values: `advanced` | `eliminated` | `completed`

---

### 3b. Stage unlocked (stage_start time passed)

**When:** A quest stage's `stage_start` datetime has passed. Use a **scheduled command** (e.g. Laravel `schedule:run` every minute) that checks for stages whose `stage_start` just passed within the last minute and have active participants on the **previous** stage (i.e. `current_stage = stage_number - 1` with status `active`).

**Who:** Send to all **active participants** of that quest whose `current_stage` matches the newly unlocked stage number.

**FCM payload:**
```json
{
  "message": {
    "token": "<fcm_token>",
    "data": {
      "type": "stage_unlocked",
      "participant_id": "42",
      "quest_id": "5",
      "quest_title": "Campus Hunt",
      "stage_number": "2",
      "location_hint": "Near the library"
    },
    "notification": {
      "title": "Stage Unlocked",
      "body": "Stage 2 is now open for Campus Hunt!"
    }
  }
}
```

---

### 3c. New store items

**When:** An admin creates a new store item (visible = true, within start/end date range) or makes an existing item visible.

**Who:** Send to **all users** who have FCM tokens registered. (Alternatively, batch by topic if user count is large.)

**FCM payload:**
```json
{
  "message": {
    "token": "<fcm_token>",
    "data": {
      "type": "new_store_items",
      "item_id": "7",
      "item_name": "Coffee Voucher"
    },
    "notification": {
      "title": "New in Store",
      "body": "Coffee Voucher is now available in the store!"
    }
  }
}
```

**Implementation note:** You can also use FCM **topics** (e.g. subscribe all users to a `store_updates` topic) to avoid iterating all tokens. The mobile app would subscribe to this topic on login.

---

### 3d. New quest available

**When:** A quest is **approved** (status changes to `approved` → `upcoming` or `ongoing`) and is available to users.

**Who:** Determine the target audience:
- If the quest has **no target group** (`quest_target_groups` is empty): send to **all enrolled users** (or all users with tokens).
- If the quest has **target groups**: resolve which users match (by course, year, section from `master_users`) and send to those users' tokens.
- Exclude users who are **not enrolled in the current semester** (unless it's an enrollment quest).

**FCM payload:**
```json
{
  "message": {
    "token": "<fcm_token>",
    "data": {
      "type": "new_quest",
      "quest_id": "12",
      "quest_title": "Campus Treasure Hunt",
      "quest_type": "event",
      "status": "ongoing"
    },
    "notification": {
      "title": "New Quest Available",
      "body": "Campus Treasure Hunt is now available! Scan a QR to join."
    }
  }
}
```

---

### 3e. Quest started (upcoming → ongoing)

**When:** A quest's `start_date` has passed and its status changes from `upcoming` to `ongoing`. Use the same scheduled command as 3b, or a separate one.

**Who:** Same targeting logic as 3d (target groups + enrollment).

**FCM payload:**
```json
{
  "message": {
    "token": "<fcm_token>",
    "data": {
      "type": "quest_started",
      "quest_id": "12",
      "quest_title": "Campus Treasure Hunt"
    },
    "notification": {
      "title": "Quest Started",
      "body": "Campus Treasure Hunt has started! Go scan the first QR."
    }
  }
}
```

---

## 4. Scheduled commands summary

| Command | Schedule | What it does |
|---------|----------|--------------|
| `fcm:check-stage-unlocks` | Every minute | Find stages whose `stage_start` just passed; send push (3b) to affected participants. |
| `fcm:check-quest-starts` | Every minute | Find quests whose `start_date` just passed (status `upcoming` → `ongoing`); send push (3e) to target users. |

Events 3a (ranking resolved) and 3c (new store item) are triggered **inline** (when the action happens in the controller/job), not by scheduled commands.

---

## 5. Laravel implementation hints

### FCM HTTP v1 API auth
- Create a Firebase project, download the service account JSON.
- Use `google/auth` PHP package to get an OAuth2 access token from the service account.
- Send `POST https://fcm.googleapis.com/v1/projects/{project_id}/messages:send` with `Authorization: Bearer <access_token>`.

### Recommended package
- [`laravel-notification-channels/fcm`](https://github.com/laravel-notification-channels/fcm) or [`kreait/laravel-firebase`](https://github.com/kreait/laravel-firebase) — both handle token auth and provide a clean API for sending messages.

### Where to trigger pushes

| Event | Where to add FCM send |
|-------|-----------------------|
| Ranking resolved (3a) | In the ranking job/command that changes `awaiting_ranking → active/eliminated/completed`. After updating the DB, send push. |
| Stage unlocked (3b) | New Artisan command, scheduled every minute. |
| New store item (3c) | In `StoreItemController@store` (or wherever admin creates/publishes an item). After save, send push. |
| New quest approved (3d) | In the quest approval flow (e.g. `QuestController@approve`). After setting status, resolve target users and send push. |
| Quest started (3e) | New Artisan command, scheduled every minute. Or in the same command as 3b. |

### Handling stale tokens
- FCM returns errors for invalid/expired tokens (e.g. `UNREGISTERED`, `INVALID_ARGUMENT`).
- When you get these errors, **delete** the token from `fcm_tokens` to keep the table clean.
- Optionally log these for monitoring.

---

## 6. Mobile app payload contract

The mobile app will read `data.type` to determine what screen to open:

| `data.type` | App action |
|-------------|------------|
| `ranking_resolved` | Open My Quest Detail (using `participant_id` + `quest_id`) |
| `stage_unlocked` | Open My Quest Detail (using `participant_id` + `quest_id`) |
| `new_store_items` | Open Store tab |
| `new_quest` | Open Quests tab (Discover) |
| `quest_started` | Open Quests tab (Discover) |

All `data` values must be **strings** (FCM data payloads only support string values).

The `notification` block is for the system tray notification (shown when app is in background). The `data` block is for the app to handle programmatically (shown when app is in foreground or used for deep-linking on tap).
