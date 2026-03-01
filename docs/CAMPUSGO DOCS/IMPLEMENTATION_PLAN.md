# CampusGo — System Design & Implementation Plan

Complete reference for the CampusGo schema, table purposes, and phased implementation.

---

## Table of Contents

1. [System Tables Overview](#system-tables-overview)
2. [Table Schemas & Descriptions](#table-schemas--descriptions)
3. [Implementation Phases](#implementation-phases)
4. [Migration Checklist](#migration-checklist)
5. [Decided](#decided)
6. [Will Everything Work? — Gaps & Fixes](#will-everything-work--gaps--fixes)
7. [Backend Problems (Concurrency & Data Integrity)](#backend-problems-concurrency--data-integrity)
8. [Open Decisions](#open-decisions)

---

## System Tables Overview

| # | Table | Purpose |
|---|--------|---------|
| 1 | `master_users` | Official academic list; only people here can register |
| 2 | `users` | Actual system accounts (login, points, level, stats) |
| 3 | `enrollments` | Per-semester enrollment; controls which quests a student sees |
| 4 | `quests` | Quest definition (type, rewards, approval, creation payment) |
| 5 | `quest_target_groups` | Course/year/section restrictions for a quest |
| 6 | `quest_stages` | Elimination rounds (location, max/min participants, stage_deadline, status) |
| 7 | `quest_questions` | Questions per stage (trivia, riddle, qr_scan) |
| 8 | `quest_participants` | Who joined which quest; stage and status |
| 9 | `submissions` | One answer per participant per question; correctness |
| 10 | `store_items` | Redeemable items (points cost, stock, time window) |
| 11 | `user_inventory` | Items a user owns (from store or rewards) |
| 12 | `achievements` | Badge definitions (quest count, level, event win) |
| 13 | `user_achievements` | Which users have earned which badges |
| 14 | `leaderboard` | Rankings by period (today, week, month, semester) |
| 15 | `activity_logs` | Admin audit trail (who did what, when) |
| 16 | `point_transactions` | Every points change for balance, level, and leaderboards |

---

## Table Schemas & Descriptions

---

### 1. master_users

| Field      | Type    | Description |
|------------|---------|-------------|
| id         | PK      |             |
| school_id  | varchar |             |
| first_name | varchar |             |
| last_name  | varchar |             |
| role       | enum    |             |
| course     | varchar |             |
| year_level | int     |             |
| section       | varchar |             |
| is_active     | boolean |             |
| is_registered | boolean |             |

*(Only people in this table can register. is_registered = true once they create a user account.)*

**What it is**  
The official master list of students and professors from the school.

**Why it exists**  
Only people in this table can register. Prevents outsiders from creating fake accounts.

**Why separate from users**  
- `master_users` = official academic record  
- `users` = actual system account  
- Not everyone on the master list will register.

---

### 2. users

| Field                  | Type     | Description |
|------------------------|----------|-------------|
| id                     | PK       |             |
| master_user_id         | FK       | nullable for admin |
| role                   | enum     | admin, student, professor |
| email                  | varchar  |             |
| password_hash          | varchar  |             |
| points_balance         | int      |             |
| level                  | int      |             |
| total_completed_quests | int      |             |
| total_xp_earned        | int      |             |
| created_at             | datetime |             |

*(Actual system accounts. role required for auth: admin = web registration; student/professor from master_users. total_xp_earned used for level; only increases.)*

**What it is**  
The actual CampusGo accounts: login credentials, points, level, and game statistics.

**Why separate from master_users**  
- A master user may never create an account.  
- If a student transfers, you can deactivate the master record.  
- Clean separation of authentication and academic identity (normalization).

---

### 3. enrollments

| Field        | Type    | Description |
|--------------|---------|-------------|
| id           | PK      |             |
| user_id      | FK      |             |
| semester     | varchar |             |
| is_enrolled  | boolean |             |

*(Controls quest visibility.)*

**What it is**  
Tracks whether a student is officially enrolled for a given semester.

**Why needed**  
Rule: *If not enrolled → only the enrollment quest is visible.* This table is required to enforce that.

---

### 4. quests

| Field                    | Type     | Description |
|--------------------------|----------|-------------|
| id                       | PK       |             |
| title                    | varchar  |             |
| description              | text     |             |
| quest_type               | enum     |             |
| is_elimination           | boolean  |             |
| buy_in_points            | int      |             |
| reward_points            | int      |             |
| reward_custom_prize      | varchar  |             |
| max_participants         | int      |             |
| current_participants    | int      |             |
| created_by               | FK       |             |
| approval_status          | enum     |             |
| creation_payment_status  | enum     |             |
| creation_cost_points     | int      |             |
| start_date               | datetime |             |
| end_date                 | datetime |             |
| created_at               | datetime |             |
| deleted_at               | datetime | nullable; soft delete |

*(Main quest definition. quest_type: daily, event, custom, enrollment. creation_payment_status: pending, locked, paid, refunded; nullable/N/A for professor/admin-created. creation_cost_points: points required to create quest. Use soft delete (deleted_at); do not hard delete.)*

**What it is**  
Core quest definition: type, rewards, buy-in, max participants, approval status, and creation payment (for student-created quests).

**Why approval_status**  
Only admin can approve quests before they go live.

---

### 5. quest_target_groups

| Field      | Type    | Description |
|------------|---------|-------------|
| id         | PK      |             |
| quest_id   | FK      |             |
| course     | varchar |             |
| year_level | int     |             |
| section    | varchar |             |

*(Course / year / section restrictions.)*

**What it is**  
Defines which course/year/section can join a quest. One quest can allow multiple groups.

**Why separate**  
Storing multiple sections in one column is bad design. This is a proper many-to-one (quest → many target groups).

---

### 6. quest_stages

| Field                | Type     | Description |
|----------------------|----------|-------------|
| id                   | PK       |             |
| quest_id             | FK       |             |
| stage_number         | int      |             |
| location_name        | varchar  |             |
| max_survivors        | int      |             |
| minimum_participants | int      |             |
| stage_deadline       | datetime |             |
| status               | enum     |             |

*(Elimination rounds. Stage proceeds when either max_survivors is reached OR stage_deadline has passed. If minimum_participants is not met by stage_deadline, the stage/quest is considered failed.)*

**What it is**  
Represents each elimination round. The system is fully elimination-based. Each stage has a deadline so the quest can move on even when max participants/survivors is not filled.

**Why stage_deadline**  
If max participants is not met, the stage would never complete without a deadline. So: **either** `max_survivors` is reached **or** `stage_deadline` passes — then the stage closes. If `minimum_participants` is not met by the deadline, mark the stage (or quest) as failed.

**Why separate**  
A quest has many stages; each stage has its own location, max survivors, minimum participants, deadline, and status. Keeping this in a separate table keeps the schema scalable.

---

### 7. quest_questions

| Field          | Type    | Description |
|----------------|---------|-------------|
| id             | PK      |             |
| stage_id       | FK      |             |
| question_text  | text    |             |
| question_type  | enum    |             |
| correct_answer | text    |             |

*(Questions per stage. question_type: trivia, riddle, qr_scan. Gamemaster decides how many questions per stage.)*

**What it is**  
Stores questions for each stage (trivia/riddle for quiz; qr_scan for “scan to complete”). Winner: qr_scan = fastest to scan; trivia/riddle = total score + speed.

**Why separate**  
One stage has many questions; one-to-many relationship.

---

### 8. quest_participants

| Field         | Type     | Description |
|---------------|----------|-------------|
| id            | PK       |             |
| quest_id      | FK       |             |
| user_id       | FK       |             |
| current_stage | int      |             |
| status        | enum     |             |
| joined_at     | datetime |             |

*(Who joined which quest.)*

**What it is**  
Tracks who joined which quest, their current stage, and status (including quit and winner).

**Why separate**  
Many-to-many between users and quests, with progress and status stored here.

---

### 9. submissions

| Field          | Type     | Description |
|----------------|----------|-------------|
| id             | PK       |             |
| participant_id | FK       |             |
| question_id    | FK       |             |
| answer         | text     |             |
| is_correct     | boolean  |             |
| submitted_at   | datetime |             |

*(One attempt per participant per question. Enforce unique on participant_id, question_id.)*

**What it is**  
Stores each participant’s answer and whether it was correct.

**Why needed**  
To enforce a single attempt, record correctness, and determine survivors. Required for fair elimination.

---

### 10. store_items

| Field        | Type     | Description |
|--------------|----------|-------------|
| id           | PK       |             |
| name         | varchar  |             |
| description  | text     |             |
| cost_points  | int      |             |
| stock        | int      |             |
| start_date   | datetime |             |
| end_date     | datetime |             |
| is_limited   | boolean  |             |

*(Redeemable with points.)*

**What it is**  
Items students can redeem using points (event or permanent; limited or unlimited).

**Why separate**  
Part of the in-game economy: items have cost, stock, and time windows.

---

### 11. user_inventory

| Field       | Type     | Description |
|-------------|----------|-------------|
| id          | PK       |             |
| user_id     | FK       |             |
| item_id     | FK       | nullable for quest custom prizes |
| quantity    | int      |             |
| acquired_at | datetime |             |

*Optional columns for custom prizes:* `custom_prize_description` (text), `source_quest_id` (FK nullable).

*(What a user owns. item_id nullable when entry is a quest custom prize; then use custom_prize_description and/or source_quest_id.)*

**What it is**  
Tracks which items a user has (from store redemptions or quest custom prizes). For store items: `item_id` set. For quest custom prizes: `item_id` null, store description or quest reference in a separate column if added (e.g. `custom_prize_description`, `source_quest_id`).

**Why needed**  
Classic many-to-many: one user has many items, one item can be owned by many users.

---

### 12. achievements

| Field              | Type    | Description |
|--------------------|---------|-------------|
| id                 | PK      |             |
| name               | varchar |             |
| description        | text    |             |
| requirement_type   | enum    |             |
| requirement_value  | int     |             |

*(Badge definitions.)*

**What it is**  
Defines badge requirements (e.g. “Complete 10 quests”, “Reach level 5”).

---

### 13. user_achievements

| Field           | Type     | Description |
|-----------------|----------|-------------|
| id              | PK       |             |
| user_id         | FK       |             |
| achievement_id  | FK       |             |
| earned_at       | datetime |             |

*(Who earned which badges. UNIQUE(user_id, achievement_id) to prevent duplicate awards.)*

**What it is**  
Stores which users have earned which badges.

**Why separate**  
Many users can earn the same badge; one user can earn many badges.

---

### 14. leaderboard

| Field         | Type    | Description |
|---------------|---------|-------------|
| id            | PK      |             |
| period_type   | enum    | today, week, month, semester |
| period_key    | varchar | e.g. date for today, week number, semester name |
| user_id       | FK      |             |
| total_points  | int     |             |
| rank          | int     |             |

*(Rankings by period: today, 1 week, 1 month, semester. Batch job at 12am recalculates from point_transactions.)*

**What it is**  
Stores rankings for each period: **today**, **1 week**, **1 month**, and **semester**. One row per user per period; batch job sums points from `point_transactions` and sets `rank`.

**Why separate**  
Leaderboards are time-scoped; today/week/month/semester stay separate so the app can show “top today”, “top this week”, etc.

---

### 15. activity_logs

| Field     | Type     | Description |
|-----------|----------|-------------|
| id        | PK       |             |
| user_id   | FK       |             |
| action    | text     |             |
| timestamp | datetime |             |

*(Admin monitoring.)*

**What it is**  
Audit trail: who created/approved quests, who redeemed, who joined, etc.

**Why important**  
Transparency, audit trail, and security.

---

### 16. point_transactions

| Field             | Type     | Description |
|-------------------|----------|-------------|
| id                | PK       |             |
| user_id           | FK       |             |
| amount            | int      | + or −      |
| transaction_type  | enum     | quest_reward, buy_in, store_redeem, buy_in_refund, transfer_in, transfer_out |
| reference_id      | int      | quest_id, item_id, or counterparty user_id (for transfer) |
| created_at        | datetime |             |

*(Every points change. transaction_type: quest_reward, buy_in, store_redeem, buy_in_refund, transfer_in, transfer_out. Source for balance, total_xp_earned (positive only), and leaderboard sums.)*

**What it is**  
Records every points change. Used to: keep `users.points_balance` correct, feed `total_xp_earned` (positive amounts only) for level, and sum by period for leaderboard (today, week, month, semester).

**Why needed**  
Audit trail for points; required for “points this semester” (and today/week/month) so the batch job can recalculate leaderboard ranks from transactions.

**Points sharing (user-to-user transfer)** — **Decided:**  
- Add **transfer_in** and **transfer_out** to `transaction_type`.  
- **Rules:** Only **students** can send points. **Min 10 pts, max 100 pts** per transfer.  
- One transfer = two rows (in one transaction): sender gets **transfer_out** (negative amount), receiver gets **transfer_in** (positive amount). Use `reference_id` = counterparty user_id. Transferred points do **not** count for XP/leaderboard (only balance).  

**Quest creator funding reward** — **Yes.** When a **student** creates a quest, they can put up **reward_points** from their own balance (the points the winner gets). Deduct from the creator’s `points_balance` when the quest is **approved** (or when the quest goes live), and record with a suitable transaction type (e.g. quest_reward funded by creator; or add **quest_creation_reward** if you want to distinguish). So the creator “gives away” their points as the quest prize.
---

### Phase 1 — Auth, master list, and enrollment

- **Registration**: Only allow sign-up if the user exists in `master_users` and `is_active`. Use `school_id` (+ role) to look up; create `users` with `master_user_id`; mark or track registration (e.g. `is_registered` on `master_users` if you add it).
- **Enrollment**: When listing quests for a student, join `enrollments` for current semester. If `is_enrolled` is false, show only the **enrollment quest**; otherwise show all quests they’re allowed to see (by type, dates, and `quest_target_groups`).

**Tables:** `master_users`, `users`, `enrollments`.

---

### Phase 2 — Points and quest creation rules

- **Points**: On every points change, insert a row in `point_transactions` (user_id, amount +/−, transaction_type, reference_id), then update `users.points_balance`. For earning only, also update `users.total_xp_earned` (for level).
- **Quest creation**: Students must have enough points and meet eligibility (complete **15 daily quests** before they can create custom quests); professors have unlimited creation. Store `created_by`, `creation_payment_status`, and `creation_cost_points`; enforce in backend.
- **Rewards**: Use `quests.reward_points` and `quests.reward_custom_prize`; when a quest ends, grant points to winner (and optionally participants) and record custom prizes in inventory or a dedicated table.

**Tables:** `users` (points_balance, level, total_completed_quests, total_xp_earned), `quests` (reward_points, reward_custom_prize, buy_in_points), `point_transactions`.

---

### Phase 3 — Quests, stages, questions, participants, submissions

- **Quests**: Implement `quest_type`, `approval_status`, `creation_payment_status`, `creation_cost_points`, `buy_in_points`, `max_participants`, `start_date`, `end_date`. Only admin can set `approval_status` to `approved`.
- **Targeting**: Use `quest_target_groups` when listing available quests (filter by user’s course/year/section from `master_users`).
- **Stages & questions**: Create/edit quests with `quest_stages` and `quest_questions`. Each stage has `stage_deadline` and `minimum_participants`. **Stage completion**: stage closes when **either** `max_survivors` is reached **or** `stage_deadline` has passed; if `minimum_participants` is not met by the deadline, mark the stage (or quest) as failed. QR/AR content can be derived from stage + questions (e.g. API returns question for a stage).
- **Participants & submissions**: When a user joins a quest, create `quest_participants`. On answer submit, create/update `submissions` (enforce one attempt per participant per question). Update `current_stage` and `status` (active, eliminated, quit, winner) as the quest runs.
- **Winner logic**: For **qr_scan** stages, winner = first to submit (order by `submissions.submitted_at`). For **trivia/riddle** stages, winner = highest total score, tie-break by total response time (faster = better); derive response time from `submitted_at` (e.g. time since stage start or previous submission).

**Tables:** `quests`, `quest_target_groups`, `quest_stages`, `quest_questions`, `quest_participants`, `submissions`.

---

### Phase 4 — Store, inventory, achievements, leaderboard

- **Store**: List `store_items` by date and stock; redeem by deducting `points_balance` and inserting into `user_inventory` (and decrementing `store_items.stock` if limited).
- **Inventory**: Display `user_inventory` for the current user; support both store items and quest custom prizes (e.g. `item_id` nullable and a `custom_prize` text field if needed).
- **Achievements**: On quest completion or level/points change, check `achievements` by `requirement_type` and `requirement_value`; insert into `user_achievements` if newly satisfied.
- **Leaderboard**: Table has `period_type` (today, week, month, semester) and `period_key`. Batch job at 12am sums `point_transactions` by user and period, then writes/updates `leaderboard` rows and sets `rank`. App shows leaderboards for today, 1 week, 1 month, semester.

**Tables:** `store_items`, `user_inventory`, `achievements`, `user_achievements`, `leaderboard`, `point_transactions`.

---

### Phase 5 — Activity logs and admin

- **Activity logs**: On key actions (register, quest create/approve/reject, join quest, redeem, etc.), insert into `activity_logs` (user_id, action, timestamp).
- **Admin panel**: Page that lists and filters `activity_logs` for monitoring and audit.

**Tables:** `activity_logs`.

---

## Migration Checklist

Use this when creating or altering migrations to match the design above.

| # | Table | Action |
|---|--------|--------|
| 1 | `master_users` | Create: include is_registered (replaces separate student/professor masterlists) |
| 2 | `users` | Create/update: `master_user_id` (nullable), `role`, `points_balance`, `level`, `total_completed_quests`, `total_xp_earned` |
| 3 | `enrollments` | Create |
| 4 | `quests` | Create/update: all fields; include current_participants for atomic join; quest_type includes daily, event, custom, enrollment; creation_payment_status nullable for professor/admin |
| 5 | `quest_target_groups` | Create |
| 6 | `quest_stages` | Create: include stage_deadline, minimum_participants (replaces/integrates previous “tasks” concept) |
| 7 | `quest_questions` | Create |
| 8 | `quest_participants` | Create/update: `current_stage`, `status` (include `quit`, `winner`) |
| 9 | `submissions` | Create (unique on participant_id + question_id) |
| 10 | `store_items` | Create |
| 11 | `user_inventory` | Create/update: `item_id` (nullable), `quantity`, `acquired_at`; optional: custom_prize_description, source_quest_id |
| 12 | `achievements` | Create |
| 13 | `user_achievements` | Create |
| 14 | `leaderboard` | Create: period_type (today, week, month, semester), period_key |
| 15 | `activity_logs` | Create/update: `action` (text), `timestamp` |
| 16 | `point_transactions` | Create: user_id, amount, transaction_type, reference_id, created_at |

---

## Decided

1. **Student quest creation** — Remove `difficulty` from quests. Add `creation_payment_status` (enum: pending, locked, paid, refunded) and `creation_cost_points` (int) to the quests table. Points required to create a quest are stored per quest.
2. **Eligibility to create custom quests** — Student must complete **15 daily quests** before they can use points to create a custom quest.
3. **Level formula** — Level 1 = 100 XP, Level 2 = 200 XP, Level 3 = 300 XP, etc. (i.e. Level N requires N × 100 XP). Clarify in implementation whether this is *total XP needed* to reach that level or *XP needed for that level step*.

4. **Admin accounts** — Admin accounts are created via **web registration**. When a user registers through the web app (not via master list lookup), they are created as an admin. Implement as a role/flag on `users` (e.g. `role` or separate admin path with nullable `master_user_id` for non-masterlist admins).

5. **Leaderboard update** — Use a **batch job** at **12:00 AM** to recalculate leaderboard ranks from `point_transactions`. Leaderboards for **today**, **1 week**, **1 month**, and **semester**. Every semester, semester leaderboard resets (new period_key); today/week/month roll with the calendar.

6. **QR/AR & question types** — **In-app**: When a user scans a quest QR, the CampusGo app opens a camera/view and shows the content.  
   **No multiple choice.** Only:
   - **Quiz type** (trivia, riddle) — user answers; winner = **total score** (correct answers) + **how fast they answered** (speed).
   - **Scan the QR** — user just scans to complete; winner = **who is faster** (first to scan wins).  
   **Question type** for `quest_questions.question_type`: use **trivia**, **riddle**, **qr_scan** (not mcq/identification).

   **Schema check — supported:**  
   - **qr_scan**: Record completion in `submissions` (e.g. one submission per participant for the scan). Winner = first `submitted_at` (fastest).  
   - **Trivia/riddle**: `submissions` has `is_correct` (for score) and `submitted_at` (for speed). To get "how fast they answered," use time between stage start and each submission: derive from `submissions.submitted_at` order per participant, or optionally add a `stage_entered_at` (or `question_revealed_at`) on a participant–stage table if you want explicit "time to answer." Current tables are enough if you derive stage start from previous submissions or `quest_participants.joined_at` for stage 1.

7. **Points sharing** — Add **transfer_in** and **transfer_out** to `point_transactions.transaction_type`. Only **students** can send points. **Min 10 pts, max 100 pts** per transfer. One transfer = two rows (sender: transfer_out negative; receiver: transfer_in positive); `reference_id` = counterparty user_id. Transferred points do **not** count for XP/leaderboard.

8. **Quest creator funding reward** — **Yes.** When a student creates a quest, they can fund **reward_points** from their own balance (the prize the winner gets). Deduct from creator's balance when the quest is approved (or when it goes live). So the creator "gives away" their points as the quest prize. “how fast they answered,” use time between stage start and each submission: derive from `submissions.submitted_at` order per participant, or optionally add a `stage_entered_at` (or `question_revealed_at`) on a participant–stage table if you want explicit “time to answer.” Current tables are enough if you derive stage start from previous submissions or `quest_participants.joined_at`.

---

## Will Everything Work? — Gaps & Fixes

**Short answer:** Yes. The items below are either **Done** (applied in schema) or have a clear implementation choice.

| # | Gap / risk | Fix / status |
|---|------------|----------------|
| 1 | **User role** | **Done:** `users.role` (admin, student, professor) in schema. |
| 2 | **15 daily quests eligibility** | **Option A:** Derive from `quest_participants` + `quests` where `quest_type = 'daily'` and status = winner/completed. **Option B:** Add `daily_quests_completed_count` on `users`. |
| 3 | **Custom prizes in inventory** | **Done:** `item_id` nullable; optional `custom_prize_description`, `source_quest_id` documented. |
| 4 | **Enrollment quest** | **Done:** `quest_type` includes **enrollment**. Filter so non-enrolled users only see that quest. |
| 5 | **Level / XP** | **Done:** `users.total_xp_earned` added; only increase on earning. Compute `level` from it (e.g. Level N = N×100 XP). |
| 6 | **Leaderboard + points source** | **Done:** **`point_transactions`** table added (user_id, amount, transaction_type, reference_id, created_at). On every points change, insert a transaction; batch job at 12am sums by user and **period** (today, week, month, semester) and writes **leaderboard** (period_type, period_key, total_points, rank). Leaderboards: **today**, **1 week**, **1 month**, **semester**. |
| 7 | **Creation payment for professor/admin** | **Done:** Use **nullable** `creation_payment_status` and `creation_cost_points` (0 or null) for professor/admin-created quests. |
| 8 | **Prevent double registration** | **Done:** `master_users.is_registered` added; set true on first register. Enforce in app: no second user with same `master_user_id`. |

**Migration order** — Tables in valid order; add `point_transactions` after `users`. No circular FKs.

**Summary:** Schema now includes `users.role`, `users.total_xp_earned`, `master_users.is_registered`, `quest_type` with enrollment, nullable creation payment fields, nullable `user_inventory.item_id` (+ optional custom prize columns), **point_transactions**, and **leaderboard** with period_type (today, week, month, semester). Implement remaining logic (e.g. 15 daily quests: derive or add column) as you build.

---

## Backend Problems (Concurrency & Data Integrity)

Implement these on the backend so you don’t forget. They prevent race conditions and bad data.

---

### 1. Concurrency (Max Participants Exceeded)

**Problem:**  
Multiple users join a quest/stage at the same time → participant count can exceed capacity.

**Backend solution:**
- Use **database transactions** for the join flow.
- Use an **atomic update** so the count is incremented only when under the limit.  
  Example for **quest** join (use `quests.current_participants` and `quests.max_participants`):

```sql
UPDATE quests
SET current_participants = current_participants + 1
WHERE id = ?
  AND current_participants < max_participants
```

- If **0 rows affected** → treat as “quest full” and reject the join.
- Create the `quest_participants` row only **after** a successful update (inside the same transaction).

*Schema:* `quests` table includes **current_participants** (int) for this atomic check. Keep it in sync when users join or leave.

---

### 2. Store Stock Negative

**Problem:**  
Many users redeem the same limited item at once → stock can go negative.

**Solution:**
- Perform an **atomic decrement** inside a **transaction**.
- `UPDATE store_items SET stock = stock - ? WHERE id = ? AND stock >= ?`
- If 0 rows affected → stock insufficient → **rollback** and return an error (e.g. “Out of stock”).
- Only then insert into `user_inventory` and deduct points (in the same transaction).

---

### 3. Achievement Duplication

**Problem:**  
The same badge can be awarded to a user more than once (e.g. duplicate event or bug).

**Solution:**
- Add a **UNIQUE constraint** on `(user_id, achievement_id)` in **user_achievements**.
- Then only one row per user per achievement is allowed; duplicate inserts will fail and can be ignored or handled gracefully.

---

### 4. Orphan Records

**Problem:**  
Deleting a quest (or other parent) can break relationships (participants, stages, questions, etc.) or leave orphaned rows.

**Solution:**
- Use **soft delete**: add a `deleted_at` (datetime, nullable) column on quests (and optionally other main entities).
- Never **hard delete** in normal flow; set `deleted_at = NOW()` instead.
- In queries, **filter out** soft-deleted records (`WHERE deleted_at IS NULL`).
- This keeps history and referential integrity; admins can “restore” by clearing `deleted_at` if you support it.

---

## Open Decisions

None. All decisions above are recorded. Implement phase by phase and adjust this plan as needed.
