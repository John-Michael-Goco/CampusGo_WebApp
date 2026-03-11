/** List item types for approval, created, history */

export type PendingQuest = {
    id: number;
    title: string;
    quest_type: string;
    created_at: string;
};

export type CreatedQuest = {
    id: number;
    title: string;
    quest_type: string;
    approval_status: string;
    created_at: string;
};

export type HistoryQuest = {
    id: number;
    title: string;
    quest_type: string;
    status: string;
    approval_status: string;
    created_at: string;
    updated_at: string;
    creator?: { id: number; name: string } | null;
};

export type PaginatedQuests<T> = {
    data: T[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
    prev_page_url?: string | null;
    next_page_url?: string | null;
};

/** Show page (single quest view) types */

export type Question = {
    id?: number;
    question_text: string;
    question_type: string;
    choices: { choice_text: string; is_correct: boolean }[];
};

export type Stage = {
    stage_number: number;
    location_hint: string;
    max_survivors: number | null;
    passing_score: number | null;
    minimum_participants: number | null;
    stage_deadline: string | null;
    questions: Question[];
};

export type ParticipantSubmission = {
    question_id: number;
    is_correct: boolean;
};

export type Participant = {
    id: number;
    current_stage: number;
    status: string;
    user: { id: number; name: string; email: string | null; avatar?: string | null } | null;
    submissions?: ParticipantSubmission[];
};

export type QuestShow = {
    id: number;
    title: string;
    description: string | null;
    quest_type: string;
    question_type: string;
    is_elimination: boolean;
    reward_points: number;
    reward_custom_prize: string | null;
    max_participants: number | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    approval_status: string;
    creator: { id: number; name: string } | null;
    target_display: string;
    stages: Stage[];
    participants: Participant[];
};
