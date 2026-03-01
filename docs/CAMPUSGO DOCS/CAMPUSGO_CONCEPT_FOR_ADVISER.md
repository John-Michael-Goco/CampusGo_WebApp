# CampusGo — Concept Overview for Adviser

A short overview of the CampusGo system concept, who uses it, how it works, and what it includes. Use this to present and explain the project to your adviser.

---

## What is CampusGo?

**CampusGo** is a **gamified campus engagement system** where students and professors complete **quests** (e.g. campus exploration, events, trivia, QR-based tasks), earn **points**, and use those points to join quests, create their own quests (when eligible), and redeem items in a **store**. The system encourages participation through **leaderboards** (today, week, month, semester), **achievements/badges**, and **rewards**.

---

## Who Uses the System?

| Role | Who | What they do |
|------|-----|----------------|
| **Admin** | Staff managing the system | Approve quests, manage master list (students/professors), add daily/event quests, manage store, view activity logs. Register via the web app (not from master list). |
| **Professor** | Faculty on the master list | Create custom quests (no point cost), set optional buy-in for participants, target by course/year/section or everyone. |
| **Student** | Students on the master list | Register only if on master list; complete quests, earn points, join events (sometimes with buy-in), create custom quests after completing 15 daily quests (using points), redeem points in the store. |

**Important:** Only people on the official **master list** (students and professors) can register as users. Admins register separately through the web. This keeps accounts tied to real academic identity.

---

## How Does It Work? (Flow in Simple Terms)

1. **Master list**  
   The school maintains a list of students and professors (ID, name, role, and for students: course, year, section). Only people on this list and marked as **active** can create an account.

2. **Registration**  
   A student or professor registers with their school ID. The system checks the master list; if they are there and not yet registered, it creates their account and links it to their master record.

3. **Enrollment**  
   For each semester, the system tracks whether a student is **enrolled**.  
   - **Not enrolled** → The only quest they see is the **enrollment quest** (e.g. complete it to become enrolled).  
   - **Enrolled** → They see all quests they are allowed to join (by type, dates, and targeting).

4. **Quests**  
   - Students (and professors) **join** quests. Some quests have a **points buy-in**.  
   - Quests can have multiple **stages** (e.g. elimination rounds). Each stage has a **deadline**; if max participants isn’t reached by then, the stage still ends (and the quest can be marked failed if minimum participants isn’t met).  
   - During a quest, users **scan QR codes** and/or answer **trivia/riddle** questions. Winner: for “scan” = who is fastest; for quiz = best score + speed.  
   - Participants can **quit** mid-quest.  
   - **Winner** gets a large points reward; the gamemaster can optionally give points to other participants too.

5. **Points**  
   - Every points change (earn or spend) is recorded in **point transactions**.  
   - **Earning** (e.g. quest rewards) increases **points balance** and **total XP** (used for level).  
   - **Spending** (buy-in, store redemption, creating a quest) only decreases points balance, not XP/level.

6. **Store & inventory**  
   - Students spend points to redeem **store items** (event or permanent; limited or unlimited).  
   - Quest rewards can be **points** and/or **custom prizes**; custom prizes appear in the user’s **inventory**.

7. **Leaderboards & achievements**  
   - **Leaderboards** show rankings for **today**, **1 week**, **1 month**, and **semester**. A nightly job recalculates ranks from point transactions. Semester leaderboard resets each semester.  
   - **Achievements/badges** are unlocked by completing quests, reaching a level, or other defined goals.

8. **Quest creation (custom)**  
   - **Professors** can create custom quests without spending points.  
   - **Students** can create custom quests only after completing **15 daily quests** and only if they have enough points (creation cost).  
   - **Admin** must **approve** quests before they go live.

---

## Quest Types (Summary)

| Type | Who creates | Purpose |
|------|-------------|---------|
| **Daily** | Admin | Recurring tasks (e.g. daily login, campus exploration). |
| **Event** | Admin | Time-limited events; optional points buy-in. |
| **Custom** | Admin, Professor, or eligible Student | Targeted quests (everyone or specific course/year/section); optional buy-in; students need 15 daily quests completed + points to create. |
| **Enrollment** | Admin | Single quest for non-enrolled students; completing it (or admin action) marks them enrolled. |

---

## Key Rules (Quick Reference)

- **Registration:** Only master list (and active) → can register; admin via web only.  
- **Enrollment:** Not enrolled → only enrollment quest visible; enrolled → full quest list (by targeting and dates).  
- **Points:** Currency for buy-in, store, and (for students) creating custom quests. All changes logged in point transactions.  
- **Quest approval:** Only admin can approve; professors/students submit for approval.  
- **Stages:** Each stage has a **deadline**; stage ends when either max survivors is reached or deadline passes. If minimum participants not met by deadline → quest/stage can be marked failed.  
- **Winner:** Scan-type = fastest to complete; quiz-type = best score + speed. Winner gets main points; others may get points if set by gamemaster.

---

## System Scope (Data / Tables at a Glance)

The system is built around these main data areas (for reference when discussing scope with your adviser):

| # | Area | What it stores |
|---|------|----------------|
| 1 | **Master list** | Official list of students and professors (ID, name, role, course/year/section for students; active and registration status). |
| 2 | **Users** | CampusGo accounts (login, role, points balance, level, XP, completed quests). |
| 3 | **Enrollments** | Per-semester enrollment per user (enrolled or not → controls which quests they see). |
| 4 | **Quests** | Quest definition (type, rewards, buy-in, approval status, creation payment for student-created). |
| 5 | **Targeting** | Which course/year/section (or everyone) can join a quest. |
| 6 | **Stages & questions** | Stages (with deadline, max/min participants) and questions per stage (trivia, riddle, or “scan QR”). |
| 7 | **Participants & submissions** | Who joined which quest, their stage, status (active/eliminated/quit/winner), and answers (one attempt per question). |
| 8 | **Point transactions** | Every points change (earn/spend) for balance, level, and leaderboard calculation. |
| 9 | **Store & inventory** | Store items (cost, stock, dates) and each user’s inventory (redeemed items and quest custom prizes). |
| 10 | **Achievements** | Badge definitions and which users have earned them. |
| 11 | **Leaderboard** | Rankings by period (today, week, month, semester) recalculated from point transactions. |
| 12 | **Activity logs** | Admin audit trail (who did what, when). |

---

## How You Can Use This With Your Adviser

1. **Start with “What is CampusGo?”** — Use the first section to explain the idea: gamified quests, points, store, leaderboards.  
2. **Clarify roles** — Use the “Who Uses the System?” table so they see the difference between Admin, Professor, and Student.  
3. **Walk through the flow** — Use “How Does It Work?” to explain registration → enrollment → quests → points → store and leaderboards.  
4. **Highlight rules** — Use “Key Rules” to show you’ve thought about security (master list, approval) and fairness (deadlines, min participants, one attempt per question).  
5. **Show scope** — Use “System Scope” to show the system is well-scoped (clear data areas and responsibilities).

For full technical detail (tables, fields, migrations, phases), your adviser can refer to the **Implementation Plan** document in the same folder.
