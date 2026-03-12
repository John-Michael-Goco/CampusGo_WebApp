# Quests

## Quests — List available

**GET** `/api/quests`  
**Auth:** Yes (Bearer)

Returns quests the authenticated user can join: approved, upcoming or ongoing, not already joined, and passing target-group and enrollment rules (e.g. enrollment quests only if user is not already enrolled in that semester).

**Response** `200 OK`
```json
{
  "quests": [
    {
      "id": 1,
      "title": "Campus Hunt",
      "description": "Find all QR codes...",
      "quest_type": "event",
      "question_type": "multiple_choice",
      "is_elimination": false,
      "reward_points": 50,
      "reward_custom_prize": null,
      "buy_in_points": 0,
      "max_participants": 0,
      "current_participants": 12,
      "stages_count": 3,
      "status": "ongoing",
      "start_date": "2026-03-12 08:00:00",
      "end_date": "2026-03-15 20:00:00",
      "first_stage_id": 10,
      "first_stage_location_hint": "Near the library"
    }
  ]
}
```
- `quests` is an array; may be empty if none are available.
- `first_stage_id` and `first_stage_location_hint` refer to stage 1 (for QR/location display).

**Errors**
- `401` — Missing or invalid token.

---

## Quests — Resolve from QR (step 1.3)

**GET** `/api/quests/resolve`  
**Auth:** Yes (Bearer)

Resolve which quest and stage a scanned QR refers to, and whether the authenticated user can join or play that stage.

**Query parameters** (one of the following):

| Parameter   | Type   | Required | Description |
|------------|--------|----------|-------------|
| qr         | string | Yes*     | Full URL encoded in the QR (e.g. `https://example.com/quests/5/stages/12`). Backend parses path `/quests/{id}/stages/{id}`. |
| quest_id   | int    | Yes*     | Quest ID (use with `stage_id` if not sending `qr`). |
| stage_id   | int    | Yes*     | Stage ID (use with `quest_id` if not sending `qr`). |

\* Provide either `qr` or both `quest_id` and `stage_id`.

**Response** `200 OK`
```json
{
  "quest_id": 5,
  "quest_title": "Campus Treasure Hunt",
  "stage_id": 12,
  "stage_number": 1,
  "location_hint": "Near the library",
  "can_join": true,
  "can_play": true,
  "question_type": "multiple_choice",
  "is_elimination": false,
  "stage_deadline": "2026-03-15 20:00:00",
  "stage_start": null
}
```
- `can_join`: `true` only for stage 1 when the user is not yet in the quest and is eligible (target group, quest not full, approved, etc.).
- `can_play`: `true` when the user can interact with this stage (e.g. already on this stage and stage is open, or can join via stage 1).
- `reason`: Present when the user cannot join/play; short explanation (e.g. "You are not in the target participants for this quest.", "This is not your current stage.").
- `stage_deadline` / `stage_start`: Omitted if null.

**Errors**
- `400` — Invalid or missing input (e.g. malformed `qr`, or neither `qr` nor `quest_id`+`stage_id`). Body: `{ "message": "..." }`.
- `404` — Quest or stage not found, or stage does not belong to the quest. Body: `{ "message": "..." }`.
- `401` — Missing or invalid token.

---

## Quests — List participating (taken quests with preview)

**GET** `/api/quests/participating`  
**Auth:** Yes (Bearer)

Returns quests the user is already in (taken quests). For each participation that is **active** or **awaiting_ranking** (not eliminated), the response includes a **preview**: either the **next location** (current stage's `location_hint`) when the stage is unlocked, or the **date when the stage opens** (`next_stage_opens_at`) when the current stage is locked by `stage_start`. The app can use this to show "Go to: {location}" or "Stage opens at {date}".

**Response** `200 OK`
```json
{
  "participations": [
    {
      "participant_id": 7,
      "quest_id": 5,
      "quest_title": "Campus Treasure Hunt",
      "current_stage": 2,
      "status": "active",
      "total_stages": 3,
      "preview": {
        "next_location_hint": "Near the library",
        "next_stage_number": 2
      }
    },
    {
      "participant_id": 8,
      "quest_id": 6,
      "quest_title": "QR Trail",
      "current_stage": 1,
      "status": "active",
      "total_stages": 2,
      "preview": {
        "next_stage_opens_at": "2026-03-14 09:00:00",
        "next_stage_number": 1
      }
    }
  ]
}
```
- For `active` or `awaiting_ranking`: `preview` is present — either `next_location_hint` (stage unlocked) or `next_stage_opens_at` + `next_stage_number` (stage locked).
- For `completed` or `eliminated`: `preview` is omitted.

**Errors**
- `401` — Missing or invalid token.

---

## Quests — Get quest + stage detail (step 1.4)

**GET** `/api/quests/{quest}`  
**Auth:** Yes (Bearer)

Return quest metadata and one stage's detail (read-only; no join/submit). Intended for the app's quest "show" / preview: **quest name, description, and stage location only**. Questions are not included by default; use `include_questions=1` when loading for AR after the user scans the QR.

- **Stage selection:** If `stage` is omitted and the user is a participant in this quest, the returned stage is their **current stage** (so location matches where they go next). Otherwise stage defaults to **1** (first stage).
- **Questions:** Omitted unless `include_questions=1`. Use that when showing questions in AR after a QR scan (choices still exclude `is_correct`).

**URL**
- `{quest}`: Quest ID (path).

**Query parameters**
| Parameter         | Type   | Required | Default | Description |
|-------------------|--------|----------|---------|-------------|
| stage             | int    | No       | *(see above)* | Stage number (1-based). If omitted, uses participant's current stage or 1. |
| include_questions | bool   | No       | `false` | Set to `1` or `true` to include `stage.questions` (for AR after QR scan). |

**Response** `200 OK` (default — no questions)
```json
{
  "quest": {
    "id": 5,
    "title": "Campus Treasure Hunt",
    "description": "...",
    "question_type": "multiple_choice",
    "is_elimination": false,
    "reward_points": 50,
    "reward_custom_prize": null,
    "buy_in_points": 0,
    "status": "ongoing",
    "start_date": "2026-03-12 08:00:00",
    "end_date": "2026-03-15 20:00:00"
  },
  "stage": {
    "id": 12,
    "stage_number": 1,
    "location_hint": "Near the library",
    "stage_deadline": "2026-03-15 20:00:00",
    "stage_start": null,
    "passing_score": 3
  }
}
```

With `include_questions=1`, `stage` also includes `questions` (array of `id`, `question_text`, `question_type`, `choices` with `id`, `choice_text`, `sort_order`; no `is_correct`).

**Errors**
- `404` — Quest not found (invalid id) or stage number not found for this quest. Body: `{ "message": "Stage not found." }` or Laravel's default 404 for missing quest.
- `401` — Missing or invalid token.
