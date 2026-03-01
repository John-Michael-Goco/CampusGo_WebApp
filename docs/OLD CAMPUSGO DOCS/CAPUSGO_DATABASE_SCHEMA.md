## 📊 CampusGo Database Tables

---

### Students and Professors Masterlists

#### `students_masterlist`

| Field           | Type     | Notes                                      |
|-----------------|----------|--------------------------------------------|
| id              | PK       | Primary key                                |
| student_number  | varchar  | Official student number (unique)           |
| first_name      | varchar  | Student given name                         |
| last_name       | varchar  | Student family name                        |
| course          | varchar  | Degree / program                           |
| year_level      | int      | Current year level                         |
| is_registered   | boolean  | Whether the student already registered in app |

#### `professors_masterlist`

| Field          | Type     | Notes                                      |
|----------------|----------|--------------------------------------------|
| id             | PK       | Primary key                                |
| employee_id    | varchar  | Official employee ID (unique)              |
| first_name     | varchar  | Professor given name                       |
| last_name      | varchar  | Professor family name                      |
| department     | varchar  | Department / college                       |
| is_registered  | boolean  | Whether the professor already registered in app |

---

### Authentication and Player Statistics

#### `users`

| Field                    | Type                             | Notes                                                   |
|--------------------------|----------------------------------|---------------------------------------------------------|
| id                       | PK                               | Primary key                                             |
| email                    | varchar                          | Login email (unique, required)                          |
| password                 | varchar                          | Hashed login password                                   |
| role                     | enum(student, professor, admin)  | User role for permissions                               |
| master_student_id        | FK                               | Link to `students_masterlist` (nullable, unique)        |
| master_professor_id      | FK                               | Link to `professors_masterlist` (nullable, unique)      |
| quests_completed_count   | int                              | Total quests this user has completed                    |
| gm_quest_credit          | int                              | Number of quests created/managed as gamemaster          |
| total_points             | int                              | Cumulative points earned across quests                  |
| created_at               | timestamp                        | Account creation time                                   |

---

### Quest System

#### `quests`

| Field        | Type                                              | Notes                                            |
|--------------|---------------------------------------------------|--------------------------------------------------|
| id           | PK                                                | Primary key                                      |
| title        | varchar                                           | Quest title                                      |
| description  | text                                              | Detailed quest description                       |
| created_by   | FK → users                                        | User ID of the gamemaster who created the quest  |
| quest_type   | enum(normal, event)                               | Regular quest or special event                   |
| status       | enum(draft, pending, approved, active, completed, cancelled) | Current lifecycle state of the quest  |
| start_date   | datetime                                          | Scheduled start date and time                    |
| end_date     | datetime                                          | Scheduled end date and time                      |
| created_at   | timestamp                                         | When the quest record was created                |

---

### Reward System (1 Quest = 1 Reward)

#### `rewards`

| Field        | Type        | Notes                                      |
|--------------|-------------|--------------------------------------------|
| id           | PK          | Primary key                                |
| quest_id     | FK → quests | Unique (1 quest = 1 reward)                |
| title        | varchar     | Reward name                                |
| description  | text        | Reward details / description               |
| quantity     | int         | Number of available rewards                |
| created_at   | timestamp   | When the reward configuration was created  |

---

### Task Stage System

#### `tasks`

| Field           | Type                            | Notes                                           |
|-----------------|---------------------------------|-------------------------------------------------|
| id              | PK                              | Primary key                                     |
| quest_id        | FK → quests                     | Parent quest                                    |
| task_order      | int                             | Stage number / order within quest               |
| title           | varchar                         | Task / stage title                              |
| location_text   | varchar                         | Human-readable location / AR hint               |
| qr_code_value   | varchar                         | QR code payload (must be unique)                |
| max_survivors   | int                             | Maximum survivors allowed to pass this stage    |
| status          | enum(active, locked, completed) | Current state of the task                       |
| created_at      | timestamp                       | When the task was created                       |

---

### Multi-Question Engine

#### `task_questions`

| Field           | Type       | Notes                                      |
|-----------------|------------|--------------------------------------------|
| id              | PK         | Primary key                                |
| task_id         | FK → tasks | Parent task / stage                        |
| question_text   | text       | Question text shown to the player          |
| correct_answer  | varchar    | Canonical correct answer (server-side)     |
| question_order  | int        | Order of the question within the task      |
| created_at      | timestamp  | When the question was created              |

---

### Answer Attempts (Anti-Cheat)

#### `task_question_attempts`

| Field                | Type                         | Notes                                           |
|----------------------|------------------------------|-------------------------------------------------|
| id                   | PK                           | Primary key                                     |
| task_question_id     | FK → task_questions          | Question being answered                         |
| user_id              | FK → users                   | Player who submitted the answer                 |
| answer_submitted     | varchar                      | Raw answer submitted by the player              |
| is_correct           | boolean                      | Whether the answer matched the correct answer   |
| response_time_seconds | int                         | Time taken to answer (for ranking/fairness)     |
| attempted_at         | timestamp                    | When the answer was submitted                   |
| *(constraint)*       | UNIQUE(task_question_id, user_id) | Exactly one attempt per user per question  |

---

### Participant Progress Tracking

#### `quest_participants`

| Field               | Type                                | Notes                                             |
|---------------------|-------------------------------------|---------------------------------------------------|
| id                  | PK                                  | Primary key                                       |
| quest_id            | FK                                  | Joined quest                                      |
| user_id             | FK                                  | Participating user                                |
| current_task_order  | int                                 | Current stage index the player is on              |
| status              | enum(active, eliminated, completed) | Player status in the quest                        |
| total_time_seconds  | int                                 | Total time spent across all stages                |
| joined_at           | timestamp                           | When the user joined the quest                    |
| finished_at         | timestamp                           | When the user finished or was eliminated (nullable) |

---

### Inventory System

#### `user_inventory`

| Field      | Type                      | Notes                                      |
|------------|---------------------------|--------------------------------------------|
| id         | PK                        | Primary key                                |
| user_id    | FK                        | Owner of the reward                        |
| reward_id  | FK                        | Earned reward                              |
| quest_id   | FK                        | Quest where the reward was earned          |
| status     | enum(unclaimed, claimed)  | Whether the player has claimed the reward  |
| earned_at  | timestamp                 | When the reward was granted                |

---

### Approval and Logging

#### `quest_approvals`

| Field        | Type                              | Notes                                       |
|--------------|-----------------------------------|---------------------------------------------|
| id           | PK                                | Primary key                                 |
| quest_id     | FK                                | Quest being approved                        |
| approved_by  | FK → users                        | Admin or approver user                      |
| status       | enum(pending, approved, rejected) | Current approval status                     |
| remarks      | text                              | Optional reviewer comments                  |
| approved_at  | timestamp                         | When the decision was recorded              |

#### `gamemaster_logs`

| Field        | Type       | Notes                                        |
|--------------|------------|----------------------------------------------|
| id           | PK         | Primary key                                  |
| user_id      | FK         | Gamemaster or admin who performed the action |
| action       | varchar    | Short description of the action              |
| reference_id | bigint     | Related entity ID (quest, reward, etc.)      |
| created_at   | timestamp  | When the action was logged                   |

---

## 📖 Table Explanations (Business Context)

Below is how each table fits into CampusGo’s flow: registration, gamemaster roles, quests, tasks, elimination, rewards, and inventory.

---

### Students and Professors Masterlists

#### `students_masterlist`

**Purpose:** Official list of students who are allowed to register in the app.

- Only students who have a record here can create an account. Registration is validated against this table (e.g. by `student_number`).
- `is_registered` marks whether they have already signed up in the app, so you can avoid duplicate accounts and know who is “on the list” but not yet registered.
- Holds identity data (name, course, year) so the system (and gamemasters) can see who a player is and reduce fraud.

#### `professors_masterlist`

**Purpose:** Official list of professors who are allowed to register and act as gamemasters.

- Only professors on this list can register in the app. Registration is validated against this table (e.g. by `employee_id`).
- `is_registered` indicates whether they have already created an account.
- Professors are gamemasters by default when they register; this table ensures only authorized staff can create and run quests.

---

### Authentication and Player Statistics

#### `users`

**Purpose:** All app accounts (students, professors, admins) and their gamemaster eligibility and stats.

- **Registration:** Each row is one account. `master_student_id` or `master_professor_id` links to the corresponding masterlist row, so “must have a record to register” is enforced.
- **Roles:** `role` (student, professor, admin) drives what they can do. Professors can create quests as gamemasters; students can become temporary gamemasters after completing 5 quests (see below).
- **Gamemaster eligibility (students):**  
  - `quests_completed_count` = total quests this user has finished.  
  - When a student reaches 5 completed quests, they get the option to create **one** quest as gamemaster; after that they go back to being a player. `gm_quest_credit` can track how many quests they’ve created (e.g. 0 or 1 for students).  
  - Students who are gamemasters can still join and do other quests as players.
- **Fraud / identity:** Via the FKs to the masterlists, the system (and gamemasters) always have access to full identity (name, course/department, etc.) for both professor and student gamemasters.
- **Leaderboards / stats:** `total_points` and `quests_completed_count` support rankings and progress.

---

### Quest System

#### `quests`

**Purpose:** A single quest (campaign) created by a gamemaster, with type, schedule, and lifecycle.

- **Who creates it:** `created_by` is the user (professor or student with gamemaster credit) who created the quest. That links to `users`, which in turn links to masterlists, so you have full identity for fraud prevention.
- **Location and QR:** The quest itself doesn’t store the location text; each **task** (see `tasks`) has a `location_text` and a `qr_code_value`. The gamemaster gives a text location per task and prints a QR at that location; scanning the QR opens the task and shows the question (e.g. via AR).
- **Elimination:** Elimination is per **task**, not per quest. The gamemaster sets how many people can “survive” each task (e.g. 50 → 30 → 15 → 5 → 3 → 1) via each task’s `max_survivors` in the `tasks` table.
- **Incentives:** The gamemaster must define the reward **before** the quest goes live. That’s enforced by the `rewards` table: one reward per quest, created when the quest is set up.
- **Quest type:** `quest_type` (normal vs event) distinguishes regular-day quests from special event days.
- **Safety:** `status` (draft → pending → approved → active → completed/cancelled) reflects the workflow. Quests must be approved by an admin (via the admin panel) before they can go active; approval is recorded in `quest_approvals`.
- **Schedule:** `start_date` and `end_date` define when the quest runs.

---

### Reward System (1 Quest = 1 Reward)

#### `rewards`

**Purpose:** The single reward configuration for a quest, defined by the gamemaster before the quest is created/approved.

- **One reward per quest:** `quest_id` is unique, so each quest has exactly one reward configuration. This enforces “taskmaster must provide incentives before creating the quest.”
- **What’s on offer:** `title`, `description`, `value` (e.g. points or monetary value), and `quantity` (how many rewards are available, e.g. for top N survivors).
- **Who gets it:** Only players who **finish** the quest (final survivors) are eligible. When the quest completes, the system grants this reward to those players by inserting rows into `user_inventory` (see below).

---

### Task Stage System

#### `tasks`

**Purpose:** One “stage” or “location” in a quest. Each task has a place, a QR code, a survivor cap, and questions.

- **Multiple tasks per quest:** Each quest has many tasks (`quest_id`). Order is given by `task_order` (1st location, 2nd location, etc.). Completing one task unlocks the **next** location for survivors.
- **Location and QR:**  
  - `location_text` = human-readable location (and AR hint) given by the gamemaster.  
  - `qr_code_value` = what’s encoded in the QR printed at that location. When the player scans it, the app validates and shows the question (e.g. via AR).
- **Elimination:** `max_survivors` is the cap for this stage (e.g. 50 for task 1, 30 for task 2, …). Only the first `max_survivors` players to complete this task (within the rules) advance; the rest are eliminated. When the survivor quota is filled, this task is “locked” and the next location is sent to those survivors.
- **Waiting for quota:** “Before the next task starts we wait for everyone to fill the max survivors” is implemented by: only after `max_survivors` have passed this task does the next task become available (and the next location sent) to those participants.
- **Status:** `status` (active, locked, completed) reflects whether the task is open, closed (quota reached or quest ended), or done.

---

### Multi-Question Engine

#### `task_questions`

**Purpose:** The actual questions shown at a task when the player scans the QR (e.g. in AR).

- Each **task** can have multiple questions (`task_id`). `question_order` defines the order they are shown.
- `question_text` is what the player sees; `correct_answer` is the canonical answer used for server-side validation (and anti-cheat). Only one attempt per user per question is allowed (enforced by `task_question_attempts`).

---

### Answer Attempts (Anti-Cheat)

#### `task_question_attempts`

**Purpose:** One recorded attempt per user per question; supports fairness and anti-cheat.

- Each row is one user answering one question. The unique constraint on `(task_question_id, user_id)` enforces “exactly one attempt per question per user.”
- `answer_submitted` is what they typed; `is_correct` is set after server-side validation against `task_questions.correct_answer`.
- `response_time_seconds` is used for tie-breaking when many players complete a task and only `max_survivors` can advance (e.g. faster correct answer ranks higher).

---

### Participant Progress Tracking

#### `quest_participants`

**Purpose:** Tracks each player’s progress in a quest: which stage they’re on and whether they’re still in the run or eliminated/finished.

- One row per user per quest (`quest_id`, `user_id`). When a player joins a quest, a row is created.
- **Current stage:** `current_task_order` is the task (location) they’re on. When they complete a task within the survivor cap, this advances and they get the next location.
- **Elimination:** `status` (active, eliminated, completed) indicates if they’re still in the quest, eliminated (e.g. didn’t make the cap or wrong answer), or finished as a final survivor.
- **Timing:** `total_time_seconds` can store cumulative time; `joined_at` and `finished_at` record when they joined and when they were eliminated or completed the quest.
- Used together with `tasks.max_survivors` to decide who gets the next location and who gets the reward when the quest completes.

---

### Inventory System

#### `user_inventory`

**Purpose:** Stores rewards that players have earned from completed quests; “after the player finishes the quest, incentives are stored in their inventory.”

- When a quest ends, the system creates one row per eligible survivor: `user_id`, `reward_id` (from `rewards`), `quest_id`, and `earned_at`.
- `status` (unclaimed, claimed) tracks whether the player has claimed the reward (e.g. picked it up or redeemed it). So incentives are stored here and can be shown in the app as “claimable” until claimed.

---

### Approval and Logging

#### `quest_approvals`

**Purpose:** Records admin approval or rejection of a quest for safety.

- When a gamemaster submits a quest, it goes to “pending.” An admin reviews it in the admin panel and creates a row here: `quest_id`, `approved_by` (admin user), `status` (pending/approved/rejected), optional `remarks`, and `approved_at`.
- The quest’s `status` in `quests` is updated accordingly (e.g. to approved so it can go active, or rejected).

#### `gamemaster_logs`

**Purpose:** Audit trail of what gamemasters (and admins) do.

- Each row is one action: who (`user_id`), what (`action`), and which entity (`reference_id`, e.g. quest id or reward id). Used for moderation and fraud prevention, and to keep “gamemaster identity and actions” traceable.
