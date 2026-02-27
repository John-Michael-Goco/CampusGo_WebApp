# CampusGo Database Diagram

Each section is a separate Mermaid ER diagram. Render in GitHub, GitLab, or VS Code (Mermaid support).

---

## 1. Overall

```mermaid
erDiagram
    students_masterlist ||--o| users : "master_student_id"
    professors_masterlist ||--o| users : "master_professor_id"
    users ||--o{ quests : "created_by"
    users ||--o{ quest_participants : "user_id"
    users ||--o{ task_question_attempts : "user_id"
    users ||--o{ user_inventory : "user_id"
    users ||--o{ quest_approvals : "approved_by"
    users ||--o{ gamemaster_logs : "user_id"
    quests ||--|| rewards : "quest_id"
    quests ||--o{ tasks : "quest_id"
    quests ||--o{ quest_participants : "quest_id"
    quests ||--o{ user_inventory : "quest_id"
    quests ||--o{ quest_approvals : "quest_id"
    tasks ||--o{ task_questions : "task_id"
    task_questions ||--o{ task_question_attempts : "task_question_id"
    rewards ||--o{ user_inventory : "reward_id"

    students_masterlist {
        int id
        varchar student_number
        varchar first_name
        varchar last_name
        varchar course
        int year_level
        boolean is_registered
    }

    professors_masterlist {
        int id
        varchar employee_id
        varchar first_name
        varchar last_name
        varchar department
        boolean is_registered
    }

    users {
        int id
        varchar email
        varchar password
        string role
        int master_student_id
        int master_professor_id
        int quests_completed_count
        int gm_quest_credit
        int total_points
        string created_at
    }

    quests {
        int id
        varchar title
        text description
        int created_by
        string quest_type
        string status
        string start_date
        string end_date
        string created_at
    }

    rewards {
        int id
        int quest_id
        varchar title
        text description
        int quantity
        string created_at
    }

    tasks {
        int id
        int quest_id
        int task_order
        varchar title
        varchar location_text
        varchar qr_code_value
        int max_survivors
        string status
        string created_at
    }

    task_questions {
        int id
        int task_id
        text question_text
        varchar correct_answer
        int question_order
        string created_at
    }

    task_question_attempts {
        int id
        int task_question_id
        int user_id
        varchar answer_submitted
        boolean is_correct
        int response_time_seconds
        string attempted_at
    }

    quest_participants {
        int id
        int quest_id
        int user_id
        int current_task_order
        string status
        int total_time_seconds
        string joined_at
        string finished_at
    }

    user_inventory {
        int id
        int user_id
        int reward_id
        int quest_id
        string status
        string earned_at
    }

    quest_approvals {
        int id
        int quest_id
        int approved_by
        string status
        text remarks
        string approved_at
    }

    gamemaster_logs {
        int id
        int user_id
        varchar action
        bigint reference_id
        string created_at
    }
```

---

## 2. Users & identity

```mermaid
erDiagram
    students_masterlist ||--o| users : "master_student_id"
    professors_masterlist ||--o| users : "master_professor_id"

    students_masterlist {
        int id
        varchar student_number
        varchar first_name
        varchar last_name
        varchar course
        int year_level
        boolean is_registered
    }

    professors_masterlist {
        int id
        varchar employee_id
        varchar first_name
        varchar last_name
        varchar department
        boolean is_registered
    }

    users {
        int id
        varchar email
        varchar password
        string role
        int master_student_id
        int master_professor_id
        int quests_completed_count
        int gm_quest_credit
        int total_points
        string created_at
    }
```

---

## 3. Quests & tasks

```mermaid
erDiagram
    users ||--o{ quests : "created_by"
    quests ||--|| rewards : "quest_id"
    quests ||--o{ tasks : "quest_id"
    tasks ||--o{ task_questions : "task_id"
    task_questions ||--o{ task_question_attempts : "task_question_id"
    users ||--o{ task_question_attempts : "user_id"

    users {
        int id
        varchar email
        string role
    }

    quests {
        int id
        varchar title
        text description
        int created_by
        string quest_type
        string status
        string start_date
        string end_date
        string created_at
    }

    rewards {
        int id
        int quest_id
        varchar title
        text description
        int quantity
        string created_at
    }

    tasks {
        int id
        int quest_id
        int task_order
        varchar title
        varchar location_text
        varchar qr_code_value
        int max_survivors
        string status
        string created_at
    }

    task_questions {
        int id
        int task_id
        text question_text
        varchar correct_answer
        int question_order
        string created_at
    }

    task_question_attempts {
        int id
        int task_question_id
        int user_id
        varchar answer_submitted
        boolean is_correct
        int response_time_seconds
        string attempted_at
    }
```

---

## 4. Participation & inventory

```mermaid
erDiagram
    users ||--o{ quest_participants : "user_id"
    quests ||--o{ quest_participants : "quest_id"
    users ||--o{ user_inventory : "user_id"
    quests ||--o{ user_inventory : "quest_id"
    rewards ||--o{ user_inventory : "reward_id"

    users {
        int id
        varchar email
    }

    quests {
        int id
        varchar title
    }

    rewards {
        int id
        int quest_id
        varchar title
        int quantity
    }

    quest_participants {
        int id
        int quest_id
        int user_id
        int current_task_order
        string status
        int total_time_seconds
        string joined_at
        string finished_at
    }

    user_inventory {
        int id
        int user_id
        int reward_id
        int quest_id
        string status
        string earned_at
    }
```

---

## 5. Governance

```mermaid
erDiagram
    users ||--o{ quest_approvals : "approved_by"
    quests ||--o{ quest_approvals : "quest_id"
    users ||--o{ gamemaster_logs : "user_id"

    users {
        int id
        varchar email
        string role
    }

    quests {
        int id
        varchar title
        string status
    }

    quest_approvals {
        int id
        int quest_id
        int approved_by
        string status
        text remarks
        string approved_at
    }

    gamemaster_logs {
        int id
        int user_id
        varchar action
        bigint reference_id
        string created_at
    }
```

---

For field definitions and business context, see **CAPUSGO_DATABASE_SCHEMA.md**.
