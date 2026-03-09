# Semester and Enrollment

How semesters and enrollment work in CampusGo (from the implementation plan and schema).

---

## Semesters

- **Table:** `semesters`
- **Fields:** `id`, `name` (e.g. "1st Sem 2025-2026"), `start_date`, `end_date`, `is_current` (boolean).

**Flow:**

1. **Admin creates a semester**  
   Insert a row with `name`, `start_date`, `end_date`. Set `is_current = false` until that term actually starts.

2. **When a new term starts**  
   - Set the **previous** semester’s `is_current` to `false`.  
   - Set the **new** semester’s `is_current` to `true`.  
   So there is only one current semester at a time.

3. **“Current semester” in the app**  
   Any logic that needs “this term” should use the semester where `is_current = true` (e.g. `Semester::where('is_current', true)->first()`). Use its `name` (or `id`) when dealing with enrollments and leaderboards.

---

## Enrollments

- **Table:** `enrollments`
- **Fields:** `id`, `user_id` (FK to `users`), `semester` (string, matches `semesters.name`), `is_enrolled` (boolean, default true).  
- **Unique:** `(user_id, semester)` — one row per user per semester.

**Flow:**

1. **New semester**  
   Students are **not** auto-enrolled. They only get an enrollment row when they “enroll” (e.g. complete the enrollment quest or an admin enrolls them).

2. **Enrolling a student**  
   - Ensure a semester exists and is current.  
   - Insert (or update) `enrollments`: `user_id` = student’s `users.id`, `semester` = current semester’s `name`, `is_enrolled = true`.

3. **When listing quests for a student**  
   - Resolve **current semester** (e.g. `semesters.name` where `is_current = true`).  
   - Find this user’s enrollment for that semester:  
     `Enrollment::where('user_id', $user->id)->where('semester', $currentSemesterName)->first()`.  
   - **If no row or `is_enrolled = false`**  
     → Student is **not enrolled** for the current term.  
     → Show **only the enrollment quest** (e.g. `quest_type = 'enrollment'`).  
   - **If `is_enrolled = true`**  
     → Student is **enrolled**.  
     → Show all quests they’re allowed to see (by type, dates, `quest_target_groups`, etc.), same as before.

So: **not enrolled** = only enrollment quest; **enrolled** = full quest list for that semester.

---

## Summary

| Concept | Meaning |
|--------|--------|
| **Semester** | A term (e.g. 1st Sem 2025–2026). One is marked “current” via `is_current`. |
| **Enrollment** | One row per user per semester. `is_enrolled` = whether they are officially enrolled for that term. |
| **New semester** | Admin creates semester, then sets it as current; students do **not** get enrollment rows automatically. |
| **Quest visibility** | Not enrolled → only enrollment quest. Enrolled → full quest list (by existing rules). |

Leaderboards and other “per semester” features should use the current semester’s `name` (or id) and the `enrollments` table so behavior is consistent with the above.
