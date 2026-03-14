# Submit response contract (AR / quest play)

To avoid client–backend guesswork and bugs, the mobile app expects the **POST /api/participants/{id}/submit** response to follow this contract. The app uses it to show Correct/Wrong, total score, and outcome (rewards vs next location).

---

## 1. Correct/Wrong for the **last answered question**

The app must show "Correct" or "Wrong" for the answer the user **just** submitted.

**Option A – Per-question (recommended for one-answer-at-a-time submits)**  
Each submit response describes only the question that was just submitted:

- `correct_count`: `0` or `1` (this question wrong/right)
- `total_count`: `1`

Then the app uses: **Correct** when `correct_count == 1`, **Wrong** when `correct_count == 0`.

**Option B – Cumulative**  
Each response describes the whole stage so far:

- `correct_count`: total number of correct answers so far (including this one)
- `total_count`: total number of questions in the stage (e.g. 3)

Then the app uses: **Correct** when `correct_count` increased compared to the previous submit (and we track "previous" on the client).

**Important:** The backend should pick **one** of these and stick to it for all submits in a stage. Mixing A and B causes wrong Correct/Wrong.

**Important – `passed`/`failed` are NOT per-answer flags:**  
`passed` means "the user passed the **stage**" (met the passing score). `failed` means "the user is eliminated." These are stage/quest-level outcomes. Do NOT use them to determine if a single answer was correct — the app ignores `passed: false` for individual answers because it just means "stage not completed yet."

---

## 2. Total score at the end of the stage

When the stage is finished (all questions submitted), the app shows "Score: X / Y".

- If the backend uses **Option A** above, the app accumulates `correct_count` and uses `stage.questions.size` as Y.
- If the backend uses **Option B**, the app uses the last response's `correct_count` and `total_count` as X and Y.

So the backend should either:

- Send **Option A** every time (and the app will sum correct and use question count as total), or  
- Send **Option B** every time (and the app will use the last response's counts).

---

## 3. Stage end and "rewards" vs "next location"

- **Last stage (e.g. 1-stage quest, or final stage of multi-stage):**  
  When the user has passed and there is **no** next stage, the backend should return:
  - `outcome`: **`"completed"`** (not `"advanced"`), and  
  - `rewards`: populated (points, level_up, achievements, etc.) so the app can show the reward screen.

- **Not last stage:**  
  When the user advances to the next stage, return:
  - `outcome`: **`"advanced"`**, and  
  - `next_stage_location_hint` or `next_stage_starts_at` so the app can show "Go to: …" or "Stage opens at …".

So: **use `outcome: "completed"` when the quest is finished (single-stage or last stage passed).** The app will then always show the rewards screen and never "next location" for a finished quest. The app can also fall back to "rewards" when `outcome == "advanced"` and `current_stage >= total_stages`, but relying on `"completed"` is clearer and avoids loops.

---

## 4. Backend MUST persist state changes on submit

**This is critical.** When the submit endpoint determines an outcome, the backend must **persist the change in the database**, not just return it in the response. Specifically:

### 4a. Advancing to the next stage (`outcome: "advanced"`)

When all stage questions have been answered and the user met the passing score, and there **are** more stages:

1. **Set `outcome` to `"advanced"`** in the response.
2. **Increment the participant's `current_stage`** in the database (e.g. 1 → 2).
3. **Populate `next_stage_location_hint`** (if the next stage is unlocked) or **`next_stage_starts_at`** (if locked by `stage_start`).
4. The participant status stays `"active"`.

If the backend does NOT increment `current_stage`, the user will be stuck on the same stage forever — even though the app shows "You advanced!".

### 4b. Completing the quest (`outcome: "completed"`)

When all stage questions have been answered and the user met the passing score, and this is the **last** stage:

1. **Set `outcome` to `"completed"`** in the response.
2. **Change the participant's `status`** to `"completed"` (or `"winner"`) in the database.
3. **Populate `rewards`** in the response: `points_earned`, `custom_prize`, `level_up`, `new_level`, `achievements`.
4. **Award the points** to the user's account (update user balance).
5. **Grant achievements** if any are configured for this quest.

If the backend does NOT update the status, `GET /api/quests/participating` will still show the user as `"active"` and they will never appear in quest history as completed.

### 4c. Elimination (`outcome: "eliminated"`)

1. **Set `outcome` to `"eliminated"`** and **`failed` to `true`**.
2. **Change participant `status`** to `"eliminated"` in the database.
3. **Do NOT populate `rewards`** (set to null).

---

## 5. One-at-a-time submissions

The mobile app submits answers **one question at a time** (for per-question Correct/Wrong feedback). The backend MUST handle this:

- **Track submitted answers cumulatively** per participant per stage (not just per request).
- After each individual submit, check: have **all** stage questions now been answered?
- If yes → run the passing/advancement/completion logic (§4a, §4b, §4c).
- If no → return `outcome: "partial"` or `"stage_not_ended"` and do NOT advance/complete yet.

**Example flow (3-question stage, one at a time):**

| Submit | Request body | Expected `outcome` | Backend action |
|--------|-------------|-------------------|----------------|
| 1st | `{ "answers": [{ "question_id": 1, "choice_id": 10 }] }` | `"partial"` | Record answer 1. 1/3 done → no action. |
| 2nd | `{ "answers": [{ "question_id": 2, "choice_id": 20 }] }` | `"partial"` | Record answer 2. 2/3 done → no action. |
| 3rd | `{ "answers": [{ "question_id": 3, "choice_id": 30 }] }` | `"advanced"` or `"completed"` | Record answer 3. 3/3 done → evaluate score, advance or complete. |

If the backend only triggers completion when **all answers arrive in a single request**, one-at-a-time submissions will never trigger advancement. The mobile app works around this by **batch-resubmitting all answers** after the last question (the API's idempotent replay guarantees this is safe), but the backend should handle one-at-a-time natively.

---

## 6. `GET /api/participants/{id}/play` after submit

After the submit, the app also calls `GET /api/participants/{id}/play` to get the definitive state. This response must reflect the **persisted** changes from §4:

- If advanced: `current_stage` should be the new stage number, `stage` should be the new stage's data, `stage_locked` / `next_stage_opens_at` if applicable.
- If completed: `status` should be `"completed"` or `"winner"`, `outcome` should be `"completed"`, `rewards` should be populated.
- If eliminated: `status` should be `"eliminated"`, `outcome` should be `"eliminated"`.

---

## 7. Summary for backend

| Scenario | `outcome` | `correct_count` / `total_count` | **Backend must persist** |
|----------|-----------|-----------------------------------|-----------------------|
| One answer submitted (mid-stage) | `partial` | (0 or 1) and 1 (batch) | Record the answer. No status change. |
| All answers in, passed, **last stage** | **`completed`** | Full stage score | **Status → "completed"/"winner". Populate rewards. Award points.** |
| All answers in, passed, **more stages** | `advanced` | Full stage score | **Increment `current_stage`. Populate next-stage hints.** |
| All answers in, failed passing score | `eliminated` | Full stage score | **Status → "eliminated". No rewards.** |
| Elimination stage, awaiting ranking | `awaiting_ranking` | Full stage score | **Status → "awaiting_ranking". Run ranking later.** |

Once this contract is implemented on the backend, the app logic can stay simple and we can stop guessing.

---

## 8. Elimination quest rules

Elimination quests differ from non-elimination in several important ways. The backend **must** follow these rules.

### 8a. MCQ Elimination

**There is NO passing score for advancement.** Every participant answers all questions. After submitting the final answer, the backend does NOT immediately advance or eliminate — it returns `awaiting_ranking: true`.

**Per-answer submits (mid-stage):**
- Same as non-elimination: record the answer, return `correct_count`/`total_count`, `outcome: "partial"`.
- Do NOT evaluate elimination or advancement yet.

**Final answer submitted (all questions answered):**
1. Record the answer and the **submission timestamp** (used as tiebreaker).
2. Return `outcome: "awaiting_ranking"`, `awaiting_ranking: true`.
3. Set participant status to `"awaiting_ranking"` in the database.
4. Do NOT advance or eliminate yet.

**Ranking runs when ONE of these conditions is met:**
- **All active participants** on the stage have submitted their answers, OR
- The **stage deadline** is reached (participants who didn't submit by deadline → eliminated).

**When ranking runs:**
1. Rank all participants who submitted by **score (highest first)**, then **submission time (earliest first)** as tiebreaker.
2. Only participants with score >= `passing_score` (if set) are eligible to advance.
3. Top N (up to `max_survivors`) from the eligible pool → set status to `"active"`, increment `current_stage`, set `outcome: "advanced"`. If **last stage**: status → `"winner"`, populate rewards, run `awardWinner()`.
4. Everyone else who submitted (below passing_score or outside top N) → status → `"eliminated"`, `outcome: "eliminated"`.
5. Participants who **didn't submit** before the deadline → status → `"eliminated"`.

**Response contract for MCQ elimination (after final answer):**

| Scenario | `outcome` | `awaiting_ranking` | **Backend action** |
|----------|-----------|--------------------|--------------------|
| Mid-stage answer | `partial` | `false` | Record answer. No status change. |
| Final answer submitted | `awaiting_ranking` | `true` | Record answer + timestamp. Status → `"awaiting_ranking"`. |
| After ranking → advanced (not last stage) | `advanced` | `false` | Status → `"active"`. Increment `current_stage`. |
| After ranking → winner (last stage) | `completed` | `false` | Status → `"winner"`. Populate rewards. Award points. |
| After ranking → eliminated | `eliminated` | `false` | Status → `"eliminated"`. No rewards. |

### 8b. QR Scan Elimination

**Non-last stages:**
Same as MCQ elimination — submit `stage_completed: true`, backend returns `awaiting_ranking: true`. Ranking runs at stage deadline or when all participants submit. Rank by **submission time (earliest first)**; top `max_survivors` advance.

**Last stage (immediate winner):**
The first participant to submit `stage_completed: true` wins immediately:
1. Set their status to `"winner"`, run `awardWinner()`, return `outcome: "completed"` with rewards.
2. All other active participants → status → `"eliminated"`.
3. Subsequent submits → return `outcome: "eliminated"`, `message: "Too late! Another participant already completed this quest."`.
4. Resolve endpoint: if quest already has a winner → `can_play: false`, `reason: "This quest already has a winner."`.

### 8c. GET /api/participants/{id}/status (polling)

Lightweight endpoint for checking ranking status. The mobile app can show "Waiting for results" and poll, or leave AR and receive results via push notification. The status endpoint is available:

```json
// While awaiting:
{ "participant_id": 42, "status": "awaiting_ranking", "current_stage": 1, "awaiting_ranking": true, "outcome": null }

// After ranking resolved:
{ "participant_id": 42, "status": "active", "current_stage": 2, "awaiting_ranking": false, "outcome": "advanced" }
```

---

## 9. Backend implementation status (CampusGo)

This section confirms the current backend matches the contract above.

| Contract requirement | Backend behavior | Status |
|---------------------|------------------|--------|
| **§1–2 Correct/counts** | Mid-stage (`partial` / `stage_not_ended`): `correct_count` / `total_count` = **batch** for this request (e.g. 0 or 1 and 1). Stage end (`advanced` / `completed` / `eliminated` / `awaiting_ranking`): **full stage** score. | ✅ Same |
| **§1 passed/failed** | `passed` = stage passed; `failed` = eliminated. Not per-answer. API sets from outcome. | ✅ Same |
| **§3 Last stage** | Returns `outcome: "completed"` and populated `rewards`. Single-stage pass forced in API to `completed` + rewards. | ✅ Same |
| **§3 Not last stage** | Returns `outcome: "advanced"`, `next_stage_location_hint` and/or `next_stage_starts_at` in play payload. | ✅ Same |
| **§4a Advance** | Simulation updates `participant.current_stage`; play payload includes `next_stage_*` from DB. | ✅ Same |
| **§4b Complete** | Simulation sets `status` to `winner`; `awardWinner()` updates user (points, XP, level, enrollment); API returns `rewards` (points_earned, custom_prize, level_up, achievements). | ✅ Same |
| **§4c Eliminated** | Simulation sets `status` to `eliminated`; API sets `failed: true`, `rewards: null`. | ✅ Same |
| **§5 One-at-a-time** | Submissions stored per (participant, question). When `allStageQuestionsAnswered` (all stage questions have a submission), then run pass/advance/complete/eliminate. Partial returns until then. | ✅ Same |
| **§6 GET play after submit** | Play payload is built from refreshed participant and quest; reflects persisted `current_stage`, `status`, and `rewards`. | ✅ Same |
| **§7 Summary table** | All outcomes return `correct_count` / `total_count` where applicable (partial = batch; stage end = full stage; QR = 1/1). `total_stages` always in play/submit. | ✅ Same |

| **§8a MCQ Elimination** | `handleElimMC`: status → `awaiting_ranking`, ranking by score+time when all submit or deadline; `runEliminationRanking` applies `passing_score` filter, top `max_survivors` advance. | ✅ Same |
| **§8b QR Elimination (last stage)** | `handleElimQR`: first submitter → `winner` + `awardWinner()` + eliminate rest; subsequent → `eliminated`. Resolve blocks with "already has a winner". Submit blocks with immediate elimination. | ✅ Same |
| **§8b QR Elimination (non-last)** | `handleElimQR`: `awaiting_ranking` + `runEliminationRankingQR` by submission time; top `max_survivors` advance. | ✅ Same |
| **§8c Status polling** | `GET /api/participants/{id}/status` returns `status`, `current_stage`, `awaiting_ranking`, `outcome`. | ✅ Same |

**Conclusion:** The backend implements the submit-response contract. No changes required for alignment.

---

## 10. Changelog

### Non-elimination: advance immediately on pass (removed `stage_not_ended` gate)

**Date:** 2026-03-14  
**Files changed:** `app/Http/Controllers/Simulation/QuestParticipationController.php`  
**Methods:** `handleNonElimMC`, `handleNonElimQR`

**Before:**  
Non-elimination quests (both MCQ and QR) had a `stage_not_ended` check: if the stage deadline (or quest end date) was still in the future, the backend returned `outcome: "stage_not_ended"` and did **not** advance `current_stage`, change `status`, or award rewards. The user was stuck on the same stage until the deadline passed, even though they had already passed.

**After:**  
The `stage_not_ended` gate was removed. Non-elimination quests now **advance immediately** when the user passes:

- **Pass + last stage** → `status = "winner"`, `awardWinner()` (points, XP, level, enrollment), `outcome: "completed"`, rewards populated.
- **Pass + more stages** → `current_stage` incremented in DB, `outcome: "advanced"`, next-stage hints in response.
- **Fail (below passing_score)** → `status = "eliminated"`, `outcome: "eliminated"`.

The stage deadline still controls when **new submissions are blocked** (checked in the API submit handler before calling `processSubmit`), but it no longer blocks advancement after passing.

**Why:** For non-elimination quests there is no need to wait for a deadline before advancing. The user answered correctly and should move on. Elimination quests are unaffected (they use `awaiting_ranking` and ranking runs when all participants submit or the deadline passes).

**`stage_not_ended` outcome:** This outcome is no longer returned by non-elimination handlers. It may still appear in elimination flows if applicable (though currently elimination uses `awaiting_ranking` instead). The app should treat `stage_not_ended` the same as `partial` if it ever appears (no status change, stay on current stage).

### QR scan elimination, last stage: first to scan wins (2026-03-14)

**Files changed:**
- `app/Http/Controllers/Simulation/QuestParticipationController.php` (`handleElimQR`)
- `app/Http/Controllers/Api/QuestController.php` (`resolve`)
- `app/Http/Controllers/Api/ParticipantController.php` (`submit`)

**Before:**  
QR elimination on the last stage used `awaiting_ranking` — all participants submitted, then ranking ran by submission time. The winner was determined only after all participants submitted or the deadline passed.

**After:**  
On the **last stage** of a QR elimination quest, the result is immediate:

1. **First participant** submits `stage_completed: true` → status set to `"winner"`, `awardWinner()` runs (points, XP, level, enrollment), all other active participants on that stage are set to `"eliminated"`, response: `outcome: "completed"` with rewards.
2. **Every subsequent participant** submits → status set to `"eliminated"`, response: `outcome: "eliminated"`, message: "Too late! Another participant already completed this quest."
3. **Resolve endpoint** (`GET /api/quests/resolve`) — when the quest already has a winner: `can_join: false`, `can_play: false`, `reason: "This quest already has a winner."` So late scanners see the rejection in AR without even submitting.
4. **Submit endpoint** — if a participant tries to submit after a winner exists, they are immediately eliminated (status set to `"eliminated"` in DB) and get `outcome: "eliminated"`.

**Non-last stages** are unaffected: they still use `awaiting_ranking` + batch ranking by submission time.

**Why:** For QR scan elimination, winner = fastest to scan. On the last stage there is no "next stage" to advance to, so waiting for everyone to submit is pointless — the first submitter should win immediately.
